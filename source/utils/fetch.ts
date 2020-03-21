import got from '../utils/got';
import Parser from 'rss-parser';
import pMap from 'p-map';
import hashFeed from './hash-feed';
import { RecurrenceRule, scheduleJob } from 'node-schedule';
import logger from './logger';
import { findFeed } from './feed';
import { Feed } from '../types/feed';
import { config } from '../config';

import {
    getAllFeeds,
    updateHashList,
    failAttempt,
    getFeedByUrl,
    resetErrorCount,
    handleRedirect,
    updateFeedUrl
} from '../proxies/rss-feed';

const { notify_error_count, item_num, fetch_gap, concurrency } = config;

async function handleErr(e, feed) {
    logger.info(feed, 'ERROR_MANY_TIME');
    process.send({
        success: false,
        message: 'MAX_TIME',
        err: e.message,
        feed
    });
    const originUrl = new URL(feed.url).origin;
    const res = await got(originUrl);
    const newUrl = await findFeed(res.body, originUrl);
    if (newUrl.length > 0) {
        updateFeedUrl(feed.url, newUrl[0]);
        process.send({
            success: false,
            message: 'CHANGE',
            err: e.message,
            new_feed: newUrl,
            feed
        });
    }
}

const fetch = async (feedUrl): Promise<any[] | void> => {
    try {
        logger.debug(`fetching ${feedUrl}`);
        const res = await got.get(encodeURI(feedUrl));
        // handle redirect
        if (encodeURI(feedUrl) !== res.url) {
            await handleRedirect(feedUrl, decodeURI(res.url));
        }
        const parser = new Parser();
        const feed = await parser.parseString(res.body);
        const items = feed.items.slice(0, item_num);
        await resetErrorCount(feedUrl);
        return items.map((item) => {
            const { link, title, content, guid, id } = item;
            return { link, title, content, guid, id };
        });
    } catch (e) {
        logger.error(`${feedUrl} ${e.message}`);
        await failAttempt(feedUrl);
        const feed = await getFeedByUrl(feedUrl);
        const round_time = notify_error_count * 10;
        const round_happen =
            feed.error_count % round_time === 0 &&
            feed.error_count > round_time;
        if (feed.error_count === notify_error_count || round_happen) {
            handleErr(e, feed);
        }
    }
};

const fetchAll = async () => {
    process.send && process.send('start fetching');

    const allFeeds = await getAllFeeds();
    await pMap(
        allFeeds,
        async (eachFeed: Feed) => {
            const oldHashList = JSON.parse(eachFeed.recent_hash_list);
            let newItems, sendItems;
            try {
                newItems = await fetch(eachFeed.url);
                if (!newItems) {
                    logger.debug(eachFeed.url, 'Error');
                } else {
                    const newHashList: string[] = await Promise.all(
                        newItems.map(
                            async (item): Promise<string> => {
                                return await hashFeed(item);
                            }
                        )
                    );
                    sendItems = await Promise.all(
                        newItems.map(async (item) => {
                            const hash = await hashFeed(item);
                            if (oldHashList.indexOf(hash) === -1) return item;
                        })
                    );
                    sendItems = sendItems.filter((i) => i);
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
                    eachFeed
                });
        },
        { concurrency }
    );

    logger.info('fetch a round');
};

function run() {
    try {
        fetchAll();
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
