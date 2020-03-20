import got from '../utils/got';
import { findFeed, isFeedValid } from '../utils/feed';
import errors from '../utils/errors';
import Parser from 'rss-parser';
import i18n from '../i18n';
import { getFeedByUrl } from '../proxies/rss-feed';
import {Feed} from "../types/feed";

export default async (ctx, next) => {
    const url = encodeURI(ctx.state.feedUrl);
    let feed: Feed | Parser.Output| undefined;
    feed = await getFeedByUrl(url);
    if (feed) {
        feed = (feed as Feed);
        ctx.state.feed = feed;
        ctx.state.feed.title = feed.feed_title;
        await next();
    } else {
        try {
            const res = await got(url);
            ctx.state.feedUrl = decodeURI(res.url); // handle redirect
            feed = await isFeedValid(res.body);
            if (!feed) { // feed: undefined
                // check feedUrl
                ctx.state.feedUrl = await findFeed(res.body, res.url);
                ctx.state.feedUrl = ctx.state.feedUrl.map(decodeURI);
                const parser = new Parser();
                switch (ctx.state.feedUrl.length) {
                    case 0:
                        throw errors.newCtrlErr('FETCH_ERROR');
                    case 1:
                        // eslint-disable-next-line no-case-declarations
                        const res = await got(encodeURI(ctx.state.feedUrl[0]));
                        feed = await parser.parseString(res.body);
                        delete feed.items;
                        ctx.state.feed = feed;
                        ctx.state.feedUrl = ctx.state.feedUrl[0];
                        await next(); // next
                        break;
                    default:
                        // eslint-disable-next-line no-case-declarations
                        const builder = [];
                        builder.push(
                            `**${
                                i18n[ctx.state.lang]['FOUND_FEED_MORE_THAN_ONE']
                            }:**`
                        );
                        builder.push(...ctx.state.feedUrl);
                        ctx.replyWithMarkdown(builder.join('\n'));
                        break;
                }
            } else {
                feed = (feed as Parser.Output);
                delete feed.items;
                ctx.state.feed = feed;
                await next();
            }
        } catch (e) {
            if (e instanceof errors.ControllableError) throw e;
            throw errors.newCtrlErr('FETCH_ERROR', e);
        }
    }
};
