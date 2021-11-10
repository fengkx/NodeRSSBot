import { MContext, Next } from '../types/ctx';

import { getFeedsByTitle } from '../proxies/rss-feed.js';
import errors from '../utils/errors.js';
import { decodeUrl } from '../utils/urlencode.js';
export default async (ctx: MContext, next: Next): Promise<void> => {
    const me = await ctx.telegram.getMe();
    const myId = me.id;
    const replyToMessage = ctx.message.reply_to_message;
    if (!replyToMessage || replyToMessage.from.id !== myId) {
        throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    }
    const title = replyToMessage.text.split('\n')[0];
    const feeds = await getFeedsByTitle(title);
    if (feeds.length > 1) throw errors.newCtrlErr('SAME_NAME');
    if (feeds.length === 0) throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    ctx.state.feed = feeds[0];
    ctx.state.feedUrl = decodeUrl(feeds[0].url);
    await next();
};
