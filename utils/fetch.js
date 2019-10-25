const got = require('./got');
const Parser = require('rss-parser');
const pMap = require('p-map');
const hashFeed = require('./hash-feed');
const _pick = require('lodash.pick');
const schedule = require('node-schedule');
const logger = require('./logger');
const feedUtil = require('./feed');
const errors = require('./errors');
const {
    getAllFeeds,
    updateHashList,
    failAttempt,
    getFeedByUrl,
    resetErrorCount,
    handleRedirect,
    updateFeedUrl
} = require('../proxies/rss-feed');

const {
    notify_error_count,
    item_num,
    fetch_gap,
    concurrency
} = require('../config');

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
    const newUrl = await feedUtil.findFeed(res.body, originUrl);
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

const fetch = async (feedUrl) => {
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
            return _pick(item, ['link', 'title', 'content', 'guid', 'id']);
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
        throw errors.newCtrlErr('FETCH_ERROR', e);
    }
};

const fetchAll = async () => {
    process.send && process.send('start fetching');

    const allFeeds = await getAllFeeds();
    await pMap(
        allFeeds,
        async (eachFeed) => {
            const oldHashList = JSON.parse(eachFeed.recent_hash_list);
            let newItems, sendItems;
            try {
                newItems = await fetch(eachFeed.url);
                if (!newItems) {
                    logger.debug(eachFeed.url, 'Error');
                } else {
                    const newHashList = await Promise.all(
                        newItems.map(async (item) => {
                            return await hashFeed(item);
                        })
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
const rule = new schedule.RecurrenceRule();
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

// eslint-disable-next-line
const j = schedule.scheduleJob(rule, run);
