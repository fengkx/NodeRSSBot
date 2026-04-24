import cleanStack from '@cjsa/clean-stack';
import * as Sentry from '@sentry/node';
import fastQueue from 'fastq';
import got from '../utils/got';
import { RecurrenceRule, scheduleJob } from 'node-schedule';

import logger, { logHttpError } from './logger';
import { findFeed, getNewItems } from './feed';
import { config } from '../config';
import { Feed, FeedItem } from '../types/feed';
import { Optional, Option, isNone, none, isSome } from '../types/option';
import { parseString } from '../parser/parse';
import {
    getAllFeeds,
    updateHashList,
    failAttempt,
    getFeedByUrl,
    updateFeed,
    handleRedirect
} from '../proxies/rss-feed';
import {
    Messenger,
    SuccessMessage,
    ErrorMaxTimeMessage,
    ChangeFeedUrlMessage
} from '../types/message';
import { encodeUrl } from './urlencode';
import { db } from '../database';

type QueueResult = FeedItem[] | undefined;
type QueueCallback = (err?: Error | null, result?: QueueResult) => void;
type ErrorLike = {
    cause?: unknown;
    message?: string;
    name?: string;
    stack?: string;
};

const { notify_error_count, item_num, concurrency, fetch_gap, db_pool_max } =
    config;

export function getEffectiveConcurrency(
    configuredConcurrency: number,
    dbPoolMax: number
): number {
    return Math.min(configuredConcurrency, Math.max(1, dbPoolMax - 2));
}

export const effectiveConcurrency = getEffectiveConcurrency(
    concurrency,
    db_pool_max
);

const inQueueSet = new Set<number>();
let isFetchingRound = false;
let lastDueFeedCount = 0;
let lastScheduledFeedCount = 0;
let lastDuplicateSkippedFeedCount = 0;

function nextFetchTimeStr(minutes: number) {
    // use SQLite CURRENT_TIMESTAMP return format like `2021-03-09 06:23:43`
    // It should use the UTC timezone
    return new Date(Date.now() + minutes * 60 * 1000)
        .toISOString()
        .split('.')[0]
        .replace('T', ' ');
}

function serializeError(error: unknown): string | unknown {
    if (error instanceof Error && error.stack) {
        return cleanStack(error.stack);
    }
    if (error && typeof error === 'object' && 'stack' in error) {
        const stack = (error as ErrorLike).stack;
        if (stack) {
            return cleanStack(stack);
        }
    }
    return error;
}

function getKnexTimeoutError(error: unknown): ErrorLike | undefined {
    const seen = new Set<unknown>();
    let current: unknown = error;

    while (current && typeof current === 'object' && !seen.has(current)) {
        seen.add(current);
        const currentError = current as ErrorLike;
        if (
            currentError.name === 'KnexTimeoutError' ||
            currentError.message?.includes(
                'Knex: Timeout acquiring a connection'
            )
        ) {
            return currentError;
        }
        current = currentError.cause;
    }

    return undefined;
}

function getKnexPoolStats():
    | {
          used?: number;
          free?: number;
          pendingAcquires?: number;
          pendingCreates?: number;
      }
    | undefined {
    const pool = (db.client as { pool?: Record<string, unknown> }).pool;
    if (!pool) {
        return undefined;
    }
    const readMetric = (name: string): number | undefined => {
        const metric = pool[name];
        if (typeof metric === 'function') {
            return (metric as () => number)();
        }
        return undefined;
    };
    return {
        used: readMetric('numUsed'),
        free: readMetric('numFree'),
        pendingAcquires: readMetric('numPendingAcquires'),
        pendingCreates: readMetric('numPendingCreates')
    };
}

export function getFetchRuntimeState(): {
    configuredConcurrency: number;
    effectiveConcurrency: number;
    dbPoolMax: number;
    isFetchingRound: boolean;
    queueLength: number;
    queueRunning: number;
    inflightFeedCount: number;
    lastDueFeedCount: number;
    lastScheduledFeedCount: number;
    lastDuplicateSkippedFeedCount: number;
} {
    return {
        configuredConcurrency: concurrency,
        effectiveConcurrency,
        dbPoolMax: db_pool_max,
        isFetchingRound,
        queueLength: queue.length(),
        queueRunning: queue.running(),
        inflightFeedCount: inQueueSet.size,
        lastDueFeedCount,
        lastScheduledFeedCount,
        lastDuplicateSkippedFeedCount
    };
}

function logFetchBacklog(): void {
    const state = getFetchRuntimeState();
    if (
        state.queueLength === 0 &&
        state.queueRunning === 0 &&
        state.inflightFeedCount === 0
    ) {
        return;
    }

    logger.info({
        message: 'fetch backlog',
        ...state,
        ...getKnexPoolStats()
    });
}

function reportKnexTimeoutError(
    error: unknown,
    feed?: Pick<Feed, 'feed_id' | 'url'>
): void {
    const knexError = getKnexTimeoutError(error);
    if (!knexError) {
        return;
    }

    const poolStats = getKnexPoolStats();
    const extra = {
        ...getFetchRuntimeState(),
        ...poolStats,
        feed_id: feed?.feed_id,
        feed_url: feed?.url
    };

    logger.error({
        message: 'Knex pool timeout while fetching feed',
        type: 'db_timeout',
        error: serializeError(knexError),
        ...extra
    });

    if (config.sentry_dsn) {
        Sentry.withScope((scope) => {
            scope.setTag('error_type', 'db_timeout');
            if (feed?.feed_id !== undefined) {
                scope.setTag('feed_id', String(feed.feed_id));
            }
            if (feed?.url) {
                scope.setTag('feed_url', feed.url);
            }
            scope.setExtras(extra);
            Sentry.captureException(
                knexError instanceof Error
                    ? knexError
                    : new Error(
                          knexError.message || 'Knex pool timeout detected'
                      )
            );
        });
    }
}

async function handleErr(
    e: Pick<Messenger, 'message'>,
    feed: Feed
): Promise<void> {
    logger.info(`${feed.feed_title} ${feed.url}`, 'ERROR_MANY_TIME');
    const message: ErrorMaxTimeMessage = {
        success: false,
        message: 'MAX_TIME',
        err: { message: e.message },
        feed
    };
    process.send && process.send(message);
    try {
        const { origin } = new URL(feed.url);
        const res = await got(origin);
        const text = await res.textConverted();
        const newUrl = await findFeed(text, origin);
        if (newUrl.length > 0) {
            await handleRedirect(feed.url, newUrl[0]);
            const message: ChangeFeedUrlMessage = {
                success: false,
                message: 'CHANGE',
                new_feed: newUrl,
                err: { message: e.message },
                feed: feed
            };
            process.send && process.send(message);
        }
    } catch (err) {
        logger.error(`handlerError: ${err.stack ?? err.message}`);
    }
}

export async function fetch(feedModal: Feed): Promise<Option<FeedItem[]>> {
    const feedUrl = feedModal.url;
    try {
        logger.debug(`fetching ${feedUrl}`);
        const requestUrl = encodeUrl(feedUrl);
        const request = got(requestUrl, {
            headers: {
                'If-None-Match': feedModal.etag_header,
                'If-Modified-Since': feedModal.last_modified_header
            }
        });

        const res = await request;
        if (res.status === 304) {
            const updatedFeedModal: Partial<Feed> & { feed_id: number } = {
                feed_id: feedModal.feed_id,
                error_count: 0,
                next_fetch_time: nextFetchTimeStr(
                    feedModal.ttl || config['GAP_MINUTES']
                )
            };
            await updateFeed(updatedFeedModal);
            return none;
        }
        if (requestUrl !== res.url && res.status === 301) {
            await handleRedirect(feedUrl, res.url);
        }
        const text = await res.textConverted();
        const feed = await parseString(text);
        const items = feed.items;
        const ttlMinutes =
            typeof feed.ttl === 'number' && !Number.isNaN(feed.ttl)
                ? feed.ttl
                : config['GAP_MINUTES'];
        const updatedFeedModal: Partial<Feed> & { feed_id: number } = {
            feed_id: feedModal.feed_id,
            error_count: 0,
            next_fetch_time: nextFetchTimeStr(ttlMinutes)
        };
        if (feed.title !== feedModal.feed_title) {
            updatedFeedModal.feed_title = feed.title;
        }
        if (!Number.isNaN(feed.ttl) && feed.ttl !== feedModal.ttl) {
            updatedFeedModal.ttl = feed.ttl;
        }
        const lastModifiedHeader = res.headers.get('last-modified');
        if (lastModifiedHeader !== feedModal.last_modified_header) {
            updatedFeedModal.last_modified_header = lastModifiedHeader;
        }
        const etag = res.headers.get('etag');
        if (etag !== feedModal.etag_header) {
            updatedFeedModal.etag_header = etag || '';
        }
        await updateFeed(updatedFeedModal);
        return Optional(
            items.map((item) => {
                const { link, title, id } = item;
                return { link, title, id } as FeedItem;
            })
        );
    } catch (e) {
        reportKnexTimeoutError(e, feedModal);
        logHttpError(feedUrl, e);
        await failAttempt(feedUrl);
        const feed = await getFeedByUrl(feedUrl);
        if (isSome(feed)) {
            const round_time = notify_error_count * 10;
            const round_happen =
                feed.value.error_count % round_time === 0 &&
                feed.value.error_count > round_time;
            if (feed.value.error_count === notify_error_count || round_happen) {
                await handleErr(e as Messenger, feed.value);
            }
        }
    }
    return none;
}

const queue = fastQueue(async (eachFeed: Feed, cb: QueueCallback) => {
    const oldHashList = JSON.parse(eachFeed.recent_hash_list);
    let fetchedItems: Option<FeedItem[]>;
    try {
        fetchedItems = await fetch(eachFeed);
        if (isNone(fetchedItems)) {
            cb(undefined, undefined);
        } else {
            const [sendItems, newHashList] = await getNewItems(
                oldHashList,
                fetchedItems.value
            );
            if (sendItems.length > 0) {
                await updateHashList(eachFeed.feed_id, newHashList);
            }
            cb(null, sendItems);
        }
    } catch (e) {
        reportKnexTimeoutError(e, eachFeed);
        cb(e as Error, undefined);
    }
}, effectiveConcurrency);

export async function fetchAll(): Promise<void> {
    process.send && process.send('start fetching');
    const allFeeds = await getAllFeeds(config.strict_ttl);
    let duplicateSkippedFeedCount = 0;
    const scheduledFeeds = allFeeds.filter((feed) => {
        if (inQueueSet.has(feed.feed_id)) {
            duplicateSkippedFeedCount += 1;
            return false;
        }
        inQueueSet.add(feed.feed_id);
        return true;
    });
    lastDueFeedCount = allFeeds.length;
    lastScheduledFeedCount = scheduledFeeds.length;
    lastDuplicateSkippedFeedCount = duplicateSkippedFeedCount;

    logger.info({
        message: 'fetch round scheduled',
        dueFeedCount: allFeeds.length,
        scheduledFeedCount: scheduledFeeds.length,
        duplicateSkippedFeedCount,
        ...getFetchRuntimeState(),
        ...getKnexPoolStats()
    });

    if (scheduledFeeds.length === 0) {
        return;
    }

    await new Promise<void>((resolve) => {
        let remaining = scheduledFeeds.length;
        const complete = () => {
            remaining -= 1;
            if (remaining === 0) {
                resolve();
            }
        };

        scheduledFeeds.forEach((feed) => {
            queue.push(feed, (err, sendItems) => {
                inQueueSet.delete(feed.feed_id);
                if (sendItems && !err) {
                    process.send &&
                        process.send({
                            success: true,
                            sendItems: sendItems.slice(0, item_num),
                            feed
                        } as SuccessMessage);
                }
                complete();
            });
        });
    });
}

export async function run(): Promise<void> {
    if (isFetchingRound) {
        logger.info({
            message: 'skip fetch round',
            ...getFetchRuntimeState()
        });
        return;
    }

    isFetchingRound = true;
    logger.info({
        message: 'start fetch round',
        ...getFetchRuntimeState()
    });
    try {
        await fetchAll();
        logger.info({
            message: 'fetch round complete',
            ...getFetchRuntimeState()
        });
    } catch (e) {
        reportKnexTimeoutError(e);
        logger.error({
            message: 'fetch round failed',
            error: serializeError(e),
            ...getFetchRuntimeState()
        });
    } finally {
        isFetchingRound = false;
    }
}

function gc() {
    const beforeGC = process.memoryUsage();
    const gcStartTime = process.hrtime.bigint();
    global.gc();
    const afterGC = process.memoryUsage();
    const gcEndTime = process.hrtime.bigint();
    logger.info(
        `heapUsedBefore: ${beforeGC.heapUsed} heapUsedAfter: ${
            afterGC.heapUsed
        } rssBefore: ${beforeGC.rss} rssAfter: ${afterGC.rss} costed ${
            gcEndTime - gcStartTime
        }`
    );
    setTimeout(gc, 3 * 60 * 1000);
}

export function startFetchWorker(): void {
    if (config.sentry_dsn) {
        Sentry.init({
            dsn: config.sentry_dsn,
            integrations: [
                Sentry.rewriteFramesIntegration({
                    root: config['PKG_ROOT']
                })
            ],
            tracesSampleRate: 0.5
        });
    }

    logger.info({
        message: 'fetch worker initialized',
        configuredConcurrency: concurrency,
        effectiveConcurrency,
        dbPoolMax: db_pool_max
    });
    const backlogLogTimer = setInterval(logFetchBacklog, 30 * 1000);
    backlogLogTimer.unref?.();

    gc();
    void run();
    const rule = new RecurrenceRule();
    const unit = fetch_gap.substring(fetch_gap.length - 1);
    const gapNum = parseInt(fetch_gap.substring(0, fetch_gap.length - 1));
    const time_gaps = [];
    switch (unit) {
        case 'h':
            for (let i = 0; i < 24; i = i + gapNum) {
                time_gaps.push(i);
            }
            rule.hour = time_gaps;
            logger.info('fetch every ' + gapNum + ' hour(s)');
            break;
        case 'm':
        default:
            for (let i = 0; i < 60; i = i + gapNum) time_gaps.push(i);
            rule.minute = time_gaps;
            logger.info('fetch every ' + gapNum + ' minutes');
            break;
    }

    scheduleJob(rule, () => {
        void run();
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
    });
    process.on('SIGUSR2', () => {
        logger.info(
            `worker queue length: ${queue.length()},  Running: ${queue.running()}`
        );
    });
    process.on('disconnect', () => {
        process.exit();
    });
}

if (require.main === module) {
    startFetchWorker();
}
