import errors from "../utils/errors";
import got from '../utils/got';
import Parser from "rss-parser";
import {getFeedByUrl, sub} from '../proxies/rss-feed';
import i18n from '../i18n';
import {MContext, Next} from "../types/ctx";

export default async (ctx: MContext, next: Next) => {
    const urls = ctx.message.text.match(
        /(((https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/gm
    );
    const { lang } = ctx.state;
    const feedsReady = await Promise.all(
        urls.map(async (url) => {
            url = decodeURI(url);
            const feed = await getFeedByUrl(url);
            if (feed) {
                return feed;
            } else {
                try {
                    const parser = new Parser();
                    const res = await got.get(encodeURI(url));
                    const rssFeed = await parser.parseString(res.body);
                    return {
                        feed_title: rssFeed.title,
                        url
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
        .forEach(function(feed: {feed_title: string; url: string}) {
            try {
                sub(ctx.state.chat.id, feed.url, feed.feed_title);
            } catch (e) {
                if (e.message !== 'ALREADY_SUB')
                    throw errors.newCtrlErr('DB_ERROR');
            }
            builder.push(`<a href="${feed.url}">${feed.feed_title}</a>`);
        });
    if (builder.length > 1) {
        // some feed did sub successfully
        ctx.replyWithHTML(builder.join('\n'));
    }
    await next();
}
