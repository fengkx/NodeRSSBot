import { limitText, MESSAGE_LIMIT } from '../utils/limit-text';
import editResponse from '../utils/edit-response';
import errors from '../utils/errors';
import got from '../utils/got';
import { getFeedByUrl, sub } from '../proxies/rss-feed';
import i18n from '../i18n';
import { AddMessageKey, MContext, TNextFn } from '../types/ctx';
import { isSome } from '../types/option';
import { Feed } from '../types/feed';
import { parseString } from '../parser/parse';
import { decodeUrl, encodeUrl } from '../utils/urlencode';
import sanitize from '../utils/sanitize';
import escapeHtml from '../utils/escape-html';

export default async (
    ctx: MContext & AddMessageKey<'text', string>,
    next: TNextFn
): Promise<void> => {
    const urls = ctx.message.text.match(
        /^((https?:)(\/\/\/?)([\w]*(?::[\w]*)?@)?([\d\w.-]+)(?::(\d+))?)?([/\\\w.()-]*)?(?:([?][^#]*)?(#.*)?)*/gm
    );
    const { lang } = ctx.state;
    const feedsReady = await Promise.all(
        urls.map(async (url): Promise<Partial<Feed> | string> => {
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
                    return escapeHtml(
                        limitText(
                            `${url} ${i18n[lang]['FETCH_ERROR']} ${e.message}`
                        )
                    );
                }
            }
        })
    );

    const successes: string[] = [];
    const failures: string[] = [];
    for (const feed of feedsReady) {
        if (typeof feed === 'string') {
            failures.push(feed);
            continue;
        }
        try {
            await sub(ctx.state.chat.id, feed.url, feed.feed_title, feed.ttl);
        } catch (e) {
            if (e.code !== 'ALREADY_SUB')
                throw errors.newCtrlErr('DB_ERROR', e);
        }
        successes.push(
            `<a href="${escapeHtml(encodeUrl(feed.url))}">${sanitize(limitText(feed.feed_title))}</a>`
        );
    }
    const lines = successes.length
        ? [i18n[lang]['SUB_SUCCESS'], ...successes, ...failures]
        : failures;
    const messages: string[] = [];
    for (const line of lines) {
        const last = messages.length - 1;
        // +1 accounts for the '\n' joining the lines
        if (
            last >= 0 &&
            messages[last].length + line.length + 1 <= MESSAGE_LIMIT
        ) {
            messages[last] += '\n' + line;
        } else {
            messages.push(line);
        }
    }
    await editResponse(ctx, messages[0], { parse_mode: 'HTML' });
    for (const message of messages.slice(1)) await ctx.replyWithHTML(message);
    await next();
};
