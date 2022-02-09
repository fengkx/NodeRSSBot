import errors from '../utils/errors';
import got from '../utils/got';
import { getFeedByUrl, sub } from '../proxies/rss-feed';
import i18n from '../i18n';
import { AddMessageKey, MContext, TNextFn } from '../types/ctx';
import { isSome } from '../types/option';
import { Feed } from '../types/feed';
import { parseString } from '../parser/parse';
import { decodeUrl, encodeUrl } from '../utils/urlencode';

export default async (
    ctx: MContext & AddMessageKey<'text', string>,
    next: TNextFn
): Promise<void> => {
    const urls = ctx.message.text.match(
        /(((https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/gm
    );
    const { lang } = ctx.state;
    const feedsReady = await Promise.all(
        urls.map(async (url): Promise<Partial<Feed>> => {
            url = decodeUrl(url); // decode first
            const feed = await getFeedByUrl(url);
            if (isSome(feed)) {
                return feed.value;
            } else {
                try {
                    const res = await got(encodeUrl(url));
                    const text = await res.textConverted();
                    const rssFeed = await parseString(text);
                    return {
                        feed_title: rssFeed.title,
                        url,
                        ttl: Number.isNaN(rssFeed.ttl) ? 0 : rssFeed.ttl
                    };
                } catch (e) {
                    ctx.reply(`${url} ${i18n[lang]['FETCH_ERROR']}`);
                    return undefined;
                }
            }
        })
    );

    const builder = [i18n[lang]['SUB_SUCCESS']];
    feedsReady
        .filter((i) => i !== undefined)
        .forEach(function (feed: {
            feed_title: string;
            url: string;
            ttl: number;
        }) {
            try {
                sub(ctx.state.chat.id, feed.url, feed.feed_title, feed.ttl);
            } catch (e) {
                if (e.message !== 'ALREADY_SUB')
                    throw errors.newCtrlErr('DB_ERROR');
            }
            // encodeURL because it is decoded
            builder.push(
                `<a href="${encodeUrl(feed.url)}">${feed.feed_title}</a>`
            );
        });
    if (builder.length > 1) {
        // some feed did sub successfully
        ctx.replyWithHTML(builder.join('\n'));
    }
    await next();
};
