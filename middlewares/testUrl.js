const got = require('../utils/got');
const Parser = require('rss-parser');
const RSS = require('../proxies/rssFeed');

module.exports = async (ctx, next) => {
    const url = encodeURI(ctx.state.feedUrl);
    const feed = await RSS.getFeedByUrl(url);
    if (feed) {
        ctx.state.feed = feed;
        ctx.state.feed.title = feed.feed_title;
        await next();
    } else {
        try {
            const res = await got.get(url);
            const parser = new Parser();
            let feed = await parser.parseString(res.body);
            delete feed.items;
            ctx.state.feed = feed;
        } catch (e) {
            if (e.response) {
                switch (e.response.status) {
                    case 404:
                    case 403:
                        throw new Error(e.response.status);
                    default:
                        throw new Error('FETCH_ERROR');
                }
            } else {
                throw new Error('FETCH_ERROR');
            }
        }
        await next();
    }
};
