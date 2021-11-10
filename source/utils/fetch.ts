import * as fs from 'fs';
import * as path from 'path';
import got from '../utils/got.js';
import fastQueue from 'fastq';
import { RecurrenceRule, scheduleJob } from 'node-schedule';
import logger, { logHttpError } from './logger';
import { findFeed, getNewItems } from './feed.js';
import { config } from '../config.js';
import { Feed, FeedItem } from '../types/feed';
import { Optional, Option, isNone, none, isSome } from '../types/option.js';
import { parseString } from '../parser/parse.js';
import {
    getAllFeeds,
    updateHashList,
    failAttempt,
    getFeedByUrl,
    updateFeed,
    handleRedirect,
    updateFeedUrl
} from '../proxies/rss-feed';
import {
    Messager,
    SuccessMessage,
    ErrorMaxTimeMessage,
    ChangeFeedUrlMessage
} from '../types/message';
import { encodeUrl } from './urlencode';
const { notify_error_count, item_num, concurrency, fetch_gap } = config;

function nextFetchTimeStr(minutes: number) {
    // use SQLite CURRENT_TIMESTAMP return format like `2021-03-09 06:23:43`
    // It should use the UTC timezone
    return new Date(Date.now() + minutes * 60 * 1000)
        .toISOString()
        .split('.')[0]
        .replace('T', ' ');
}

function gotBugWorkaround(req) {
    req.prependOnceListener('cacheableResponse', (cacheableResponse) => {
        const fix = () => {
            if (!cacheableResponse.req) {
                return;
            }
            cacheableResponse.complete = cacheableResponse.req.res.complete;
        };
        cacheableResponse.prependOnceListener('end', fix);
        fix();
    });
}

async function handleErr(e: Messager, feed: Feed): Promise<void> {
    logger.info(`${feed.feed_title} ${feed.url}`, 'ERROR_MANY_TIME');
    const message: ErrorMaxTimeMessage = {
        success: false,
        message: 'MAX_TIME',
        err: { message: e.message },
        feed
    };
    process.send && process.send(message);
    const { origin } = new URL(feed.url);
    const res = await got(origin);
    const newUrl = await findFeed(res.body, origin);
    delete res.body;
    delete res.rawBody;
    if (newUrl.length > 0) {
        updateFeedUrl(feed.url, newUrl[0]);
        const message: ChangeFeedUrlMessage = {
            success: false,
            message: 'CHANGE',
            new_feed: newUrl,
            err: { message: e.message },
            feed: feed
        };
        process.send(message);
    }
}

async function fetch(feedModal: Feed): Promise<Option<any[]>> {
    const feedUrl = feedModal.url;
    try {
        logger.debug(`fetching ${feedUrl}`);
        const requestUrl = encodeUrl(feedUrl);
        const request = got.get(requestUrl, {
            headers: {
                'If-None-Match': feedModal.etag_header,
                'If-Modified-Since': feedModal.last_modified_header
            }
        });
        if (config.http_cache) {
            request.on('request', gotBugWorkaround);
        }
        const res = await request;
        if (res.statusCode === 304) {
            const updatedFeedModal: Partial<Feed> & { feed_id: number } = {
                feed_id: feedModal.feed_id,
                error_count: 0,
                next_fetch_time: nextFetchTimeStr(
                    feedModal.ttl || config['GAP_MINUTES']
                )
            };
            updateFeed(updatedFeedModal);
            return none;
        }
        if (requestUrl !== res.url && res.statusCode === 301) {
            await handleRedirect(feedUrl, res.url);
        }
        const feed = await parseString(res.body);
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
        if (res.headers['last-modified'] !== feedModal.last_modified_header) {
            updatedFeedModal.last_modified_header =
                res.headers['last-modified'];
        }
        const etag = Array.isArray(res.headers['etag'])
            ? res.headers['etag'][0]
            : res.headers['etag'];
        if (etag !== feedModal.etag_header) {
            updatedFeedModal.etag_header = etag || '';
        }
        await updateFeed(updatedFeedModal);
        return Optional(
            items.map((item) => {
                const { link, title, id } = item;
                return { link, title, id };
            })
        );
    } catch (e) {
        logHttpError(feedUrl, e);
        await failAttempt(feedUrl);
        const feed = await getFeedByUrl(feedUrl);
        if (isSome(feed)) {
            const round_time = notify_error_count * 10;
            const round_happen =
                feed.value.error_count % round_time === 0 &&
                feed.value.error_count > round_time;
            if (feed.value.error_count === notify_error_count || round_happen) {
                handleErr(e, feed.value);
            }
        }
    }
    return none;
}

const queue = fastQueue(async (eachFeed: Feed, cb) => {
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
        cb(e, undefined);
    }
}, concurrency);

const fetchAll = async (): Promise<void> => {
    process.send && process.send('start fetching');
    const allFeeds = await getAllFeeds(config.strict_ttl);
    allFeeds.forEach((feed) =>
        queue.push(feed, (err, sendItems) => {
            if (sendItems && !err) {
                process.send &&
                    sendItems &&
                    process.send({
                        success: true,
                        sendItems: sendItems.slice(0, item_num),
                        feed: feed
                    } as SuccessMessage);
            }
        })
    );
};

function run() {
    try {
        fetchAll().then(() => logger.info('fetch a round'));
    } catch (e) {
        logger.error(
            `[Catch in all ${e.name}] ${e.url} ${e.statusCode} ${e.statusMessage}`
        );
        logger.debug(e);
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
        } rssBefore: ${beforeGC.rss} rssAfater: ${afterGC.rss} costed ${
            gcEndTime - gcStartTime
        }`
    );
    setTimeout(gc, 3 * 60 * 1000);
}
gc();
run();
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

scheduleJob(rule, run);
process.on('SIGUSR2', () => {
    const theQueue = queue.getQueue();
    if (!process.env.NODE_PRODUTION) {
        fs.writeFileSync(
            path.join(config['PKG_ROOT'], 'logs', 'theQueue.json'),
            JSON.stringify(theQueue)
        );
    }
    logger.info(`worker queue length: ${queue.length()}`);
});
