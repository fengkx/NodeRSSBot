const got = require('../utils/got');
const feedUtil = require('../utils/feed');
const Parser = require('rss-parser');
const RSS = require('../proxies/rssFeed');
const i18n = require('../i18n');

module.exports = async (ctx, next) => {
    const url = encodeURI(ctx.state.feedUrl);
    let feed = await RSS.getFeedByUrl(url);
    if (feed) {
        ctx.state.feed = feed;
        ctx.state.feed.title = feed.feed_title;
        await next();
    } else {
        try {
            const res = await got.get(url);
            ctx.state.feedUrl = decodeURI(res.url); // handle redirect
            feed = await feedUtil.isFeedValid(res.body);
            if (!feed) {
                // check feedUrl
                ctx.state.feedUrl = await feedUtil.findFeed(res.body, res.url);
                ctx.state.feedUrl = ctx.state.feedUrl.map(decodeURI);
                const parser = new Parser();
                switch (ctx.state.feedUrl.length) {
                    case 0:
                        throw new Error('FETCH_ERROR');
                    case 1:
                        // eslint-disable-next-line no-case-declarations
                        const res = await got(encodeURI(ctx.state.feedUrl[0]));
                        feed = await parser.parseString(res.body);
                        delete feed.items;
                        ctx.state.feed = feed;
                        await next(); // next
                        break;
                    default:
                        // eslint-disable-next-line no-case-declarations
                        const builder = [];
                        builder.push(
                            `**${i18n['FOUND_FEED_MORE_THAN_ONE']}:**`
                        );
                        builder.push(...ctx.state.feedUrl);
                        ctx.replyWithMarkdown(builder.join('\n'));
                        break;
                }
            } else {
                delete feed.items;
                ctx.state.feed = feed;
                await next();
            }
        } catch (e) {
            if (e instanceof Error) throw e;
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
    }
};
