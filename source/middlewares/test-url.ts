import got from '../utils/got';
import { findFeed, isFeedValid } from '../utils/feed';
import errors from '../utils/errors';
import Parser from 'rss-parser';
import i18n from '../i18n';
import { getFeedByUrl } from '../proxies/rss-feed';
import { MContext, Next } from '../types/ctx';
import { isNone, isSome } from '../types/option';

export default async (ctx: MContext, next: Next) => {
    const url = encodeURI(ctx.state.feedUrl);
    const feedOption = await getFeedByUrl(url);
    if (isSome(feedOption)) {
        // feed is in database;
        ctx.state.feed = feedOption.value;
        await next();
    } else {
        try {
            const res = await got(url);
            ctx.state.feedUrl = decodeURI(res.url); // handle redirect
            const feedOption = await isFeedValid(res.body);
            if (isNone(feedOption)) {
                // feed is NOT valid, try to find feed by link tag with type contain rss/atom
                ctx.state.feedUrls = await findFeed(res.body, res.url);
                ctx.state.feedUrls = ctx.state.feedUrls.map(decodeURI);
                /* eslint no-case-declarations: 0*/
                const parser = new Parser();
                switch (ctx.state.feedUrls.length) {
                    case 0:
                        throw errors.newCtrlErr('FETCH_ERROR');
                    case 1:
                        const res = await got(encodeURI(ctx.state.feedUrls[0]));
                        const realFeed = await parser.parseString(res.body);
                        ctx.state.feed = {
                            url: ctx.state.feedUrls[0],
                            feed_title: realFeed.title
                        };
                        ctx.state.feedUrl = ctx.state.feedUrls[0];
                        await next(); // next
                        break;
                    default:
                        const builder = [];
                        builder.push(
                            `**${
                                i18n[ctx.state.lang]['FOUND_FEED_MORE_THAN_ONE']
                            }:**`
                        );
                        builder.push(...ctx.state.feedUrls);
                        ctx.replyWithMarkdown(builder.join('\n'));
                        break;
                }
            } else {
                // new feed is valid sub it in next middleware
                ctx.state.feed = { feed_title: feedOption.value.title };
                await next();
            }
        } catch (e) {
            if (e instanceof errors.ControllableError) throw e;
            throw errors.newCtrlErr('FETCH_ERROR', e);
        }
    }
};
