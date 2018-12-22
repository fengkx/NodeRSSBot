const axios = require('axios');
const Parser = require('rss-parser');
const config = require('../config');
const hashFeed = require('../utils/hashFeed');
const _pick = require('lodash.pick');
const {getAllFeeds, updateHashList, failAttempt, getFeedByUrl} = require('../proxies/rssFeed');
const schedule = require('node-schedule');
const logger = require('./logger');

const fetch = async (feedUrl) => {
    try {
        logger.debug(`fetching ${feedUrl}`)
        const res = await axios.get(feedUrl);
        const parser = new Parser();
        const feed = await parser.parseString(res.data);
        const items = feed.items.slice(0, config.item_num);
        const hashList = await Promise.all(
            items.map(async item => {
                return _pick(item, ['link', 'title', 'content']);
            })
        );
        return hashList;
    } catch (e) {
        failAttempt(feedUrl);
        getFeedByUrl(feedUrl).then(feed => {
           if(feed.error_count >=5 ) {
               logger.info(feed, 'ERROR_MANY_TIME')
               process.send({
                   success: false,
                   message: 'MAX_TIME',
                   feed
               })
           }
        });
        if (e instanceof Error && e.respone) {
            switch (e.respone.status) {
                case 404:
                case 403:

                    throw new Error(e.respone.status);
                default:
                    throw  new Error('FETCH_ERROR');
            }
        }
    }
};

const fetchAll = async () => {
    process.send && process.send('start fetching');

    const allFeeds = await getAllFeeds();
    await Promise.all(allFeeds.map(async eachFeed => {
        const oldHashList = JSON.parse(eachFeed.recent_hash_list);
        const newItems = await fetch(eachFeed.url, eachFeed.feed_id);
        if(!newItems) {
            logger.debug(eachFeed.url, `Error`);
        } else {
            const newHashList = await Promise.all(newItems.map(async item => {
                    return await hashFeed(item.link, item.title)
                })
            );
            await updateHashList(eachFeed.feed_id, newHashList);
            let sendItems = await Promise.all(newItems.map(async item => {
                const hash = await hashFeed(item.link, item.title);
                if (oldHashList.indexOf(hash) === -1)
                    return item;
            }));
            sendItems = sendItems.filter(i => i);
            process.send && sendItems && process.send({
                success: true,
                sendItems,
                eachFeed
            });
        }
    }));
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
const minutes = [];
for (let i = 0; i < 60; i = i + config.fetch_gap)
    minutes.push(i);
const rule = new schedule.RecurrenceRule();
rule.minute = minutes;
logger.info('fetch every ' + config.fetch_gap + ' minutes');
const j = schedule.scheduleJob(rule, run);
