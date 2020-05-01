import got from '../utils/got';
import Parser from 'rss-parser';
import pMap from 'p-map';
import hashFeed from './hash-feed';
import { RecurrenceRule, scheduleJob } from 'node-schedule';
import logger from './logger';
import { findFeed } from './feed';
import { config } from '../config';
import { Feed, FeedItem } from '../types/feed';
import { Optional, Option, isNone, none, isSome, Some } from '../types/option';

import {
    getAllFeeds,
    updateHashList,
    failAttempt,
    getFeedByUrl,
    resetErrorCount,
    handleRedirect,
    updateFeedUrl
} from '../proxies/rss-feed';
import {
    Messager,
    SuccessMessage,
    ErrorMaxTimeMessage,
    ChangeFeedUrlMessage
} from '../types/message';
const { notify_error_count, item_num, fetch_gap, concurrency } = config;

async function handleErr(e: Messager, feed: Feed): Promise<void> {
    logger.info(`${feed.feed_title} ${feed.url}`, 'ERROR_MANY_TIME');
    const message: ErrorMaxTimeMessage = {
        success: false,
        message: 'MAX_TIME',
        err: { message: e.message },
        feed
    };
    process.send(message);
    const { origin } = new URL(feed.url);
    const res = await got(origin);
    const newUrl = await findFeed(res.body, origin);
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

async function fetch(feedUrl: string): Promise<Option<FeedItem[]>> {
    try {
        logger.debug(`fetching ${feedUrl}`);
        const res = await got.get(encodeURI(feedUrl));
        // handle redirect
        if (encodeURI(feedUrl) !== res.url && Object.is(res.statusCode, 301)) {
            await handleRedirect(feedUrl, decodeURI(res.url));
        }
        const parser = new Parser();
        const feed = await parser.parseString(res.body);
        const items = feed.items.slice(0, item_num);
        await resetErrorCount(feedUrl);
        return Optional(
            items.map((item) => {
                const { link, title, content, guid, id } = item;
                return { link, title, content, guid, id };
            })
        );
    } catch (e) {
        logger.error(`${feedUrl} ${e.stack || e.message}`);
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
    return Optional();
}

const fetchAll = async (): Promise<void> => {
    process.send && process.send('start fetching');

    const allFeeds = await getAllFeeds();
    await pMap(
        allFeeds,
        async (eachFeed: Feed) => {
            const oldHashList = JSON.parse(eachFeed.recent_hash_list);
            let fetchedItems: Option<FeedItem[]>, sendItems: FeedItem[];
            try {
                fetchedItems = await fetch(eachFeed.url);
                if (isNone(fetchedItems)) {
                    logger.debug(eachFeed.url, 'Error');
                } else {
                    const newHashList: string[] = await Promise.all(
                        fetchedItems.value.map(
                            async (item: FeedItem): Promise<string> => {
                                return await hashFeed(item);
                            }
                        )
                    );
                    const newItems = await Promise.all(
                        fetchedItems.value.map(
                            async (
                                item: FeedItem
                            ): Promise<Option<FeedItem>> => {
                                const hash = await hashFeed(item);
                                if (oldHashList.indexOf(hash) === -1)
                                    return Optional(item);
                                else return none;
                            }
                        )
                    );
                    sendItems = newItems
                        .filter(isSome)
                        .map((some: Some<FeedItem>) => some.value);
                    if (sendItems.length > 0) {
                        await updateHashList(eachFeed.feed_id, newHashList);
                    }
                }
            } catch (e) {
                logger.debug(e);
            }
            process.send &&
                sendItems &&
                process.send({
                    success: true,
                    sendItems,
                    feed: eachFeed
                } as SuccessMessage);
        },
        { concurrency }
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
