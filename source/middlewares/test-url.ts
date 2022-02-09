import got from '../utils/got';
import { findFeed, isFeedValid } from '../utils/feed';
import errors from '../utils/errors';
import i18n from '../i18n';
import { getFeedByUrl } from '../proxies/rss-feed';
import { MContext, TNextFn } from '../types/ctx';
import { isNone, isSome } from '../types/option';
import { parseString } from '../parser/parse';
import { decodeUrl, encodeUrl } from '../utils/urlencode';

export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    const url = encodeUrl(ctx.state.feedUrl);
    const feedOption = await getFeedByUrl(url);
    if (isSome(feedOption)) {
        // feed is in database;
        ctx.state.feed = feedOption.value;
        await next();
    } else {
        try {
            const res = await got(url);
            ctx.state.feedUrl = decodeUrl(res.url); // handle redirect
            const text = await res.textConverted();
            const feedOption = await isFeedValid(text);
            if (isNone(feedOption)) {
                // feed is NOT valid, try to find feed by link tag with type contain rss/atom
                ctx.state.feedUrls = await findFeed(text, res.url);
                ctx.state.feedUrls = ctx.state.feedUrls.map(decodeUrl);
                /* eslint no-case-declarations: 0*/
                switch (ctx.state.feedUrls.length) {
                    case 0:
                        throw errors.newCtrlErr('FETCH_ERROR');
                    case 1:
                        const res = await got(encodeUrl(ctx.state.feedUrls[0]));
                        const text = await res.textConverted();
                        const realFeed = await parseString(text);
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
                ctx.state.feed = {
                    feed_title: feedOption.value.title,
                    ttl: feedOption.value.ttl
                };
                await next();
            }
        } catch (e) {
            if (e instanceof errors.ControllableError) throw e;
            throw errors.newCtrlErr('FETCH_ERROR', e);
        }
    }
};
