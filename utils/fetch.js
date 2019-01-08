const axios = require('../utils/axios');
const Parser = require('rss-parser');
const config = require('../config');
const hashFeed = require('../utils/hashFeed');
const _pick = require('lodash.pick');
const schedule = require('node-schedule');
const logger = require('./logger');
const {
    getAllFeeds,
    updateHashList,
    failAttempt,
    getFeedByUrl,
    resetErrorCount
} = require('../proxies/rssFeed');
const { notify_error_count } = require('../config');

// eslint-disable-next-line  max-lines-per-function
const fetch = async (feedUrl) => {
    try {
        logger.debug(`fetching ${feedUrl}`);
        const res = await axios.get(encodeURI(feedUrl));
        const parser = new Parser();
        const feed = await parser.parseString(res.data);
        const items = feed.items.slice(0, config.item_num);
        await resetErrorCount(feedUrl);
        return await Promise.all(
            items.map(async (item) => {
                return _pick(item, ['link', 'title', 'content']);
            })
        );
    } catch (e) {
        logger.error(`${feedUrl} ${e.message}`);
        await failAttempt(feedUrl);
        const feed = await getFeedByUrl(feedUrl);
        const round_time = notify_error_count * 10;
        const round_happen =
            feed.error_count % round_time === 0 &&
            feed.error_count > round_time;
        if (feed.error_count === notify_error_count || round_happen) {
            logger.info(feed, 'ERROR_MANY_TIME');
            process.send({
                success: false,
                message: 'MAX_TIME',
                err: e.message,
                feed
            });
        }
        if (e instanceof Error && e.respone) {
            logger.error(e.respone);
            switch (e.respone.status) {
                case 404:
                case 403:
                    throw new Error(e.respone.status);
                default:
                    throw new Error('FETCH_ERROR');
            }
        }
    }
};

const fetchAll = async () => {
    process.send && process.send('start fetching');

    const allFeeds = await getAllFeeds();
    await Promise.all(
        allFeeds.map(async (eachFeed) => {
            const oldHashList = JSON.parse(eachFeed.recent_hash_list);
            const newItems = await fetch(eachFeed.url, eachFeed.feed_id);
            if (!newItems) {
                logger.debug(eachFeed.url, `Error`);
            } else {
                const newHashList = await Promise.all(
                    newItems.map(async (item) => {
                        return await hashFeed(item.link, item.title);
                    })
                );
                await updateHashList(eachFeed.feed_id, newHashList);
                let sendItems = await Promise.all(
                    newItems.map(async (item) => {
                        const hash = await hashFeed(item.link, item.title);
                        if (oldHashList.indexOf(hash) === -1) return item;
                    })
                );
                sendItems = sendItems.filter((i) => i);
                process.send &&
                    sendItems &&
                    process.send({
                        success: true,
                        sendItems,
                        eachFeed
                    });
            }
        })
    );
    logger.info('fetch a round');
};

function run() {
    try {
        fetchAll();
    } catch (e) {
        logger.error(e);
    }
}

run();
const rule = new schedule.RecurrenceRule();
const unit = config.fetch_gap.substring(config.fetch_gap.length - 1);
const gapNum = parseInt(
    config.fetch_gap.substring(0, config.fetch_gap.length - 1)
);
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
