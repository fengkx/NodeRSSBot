import { MContext, TNextFn } from '../types/ctx';

import { getFeedsByTitle } from '../proxies/rss-feed';
import errors from '../utils/errors';
import { decodeUrl } from '../utils/urlencode';
export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    const me = await ctx.telegram.getMe();
    const myId = me.id;
    if (!('reply_to_message' in ctx.message)) {
        throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    }
    const replyToMessage = ctx.message.reply_to_message;
    if (replyToMessage.from.id !== myId) {
        throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    }
    //@ts-expect-error text type
    const title = replyToMessage.text.split('\n')[0];
    const feeds = await getFeedsByTitle(title);
    if (feeds.length > 1) throw errors.newCtrlErr('SAME_NAME');
    if (feeds.length === 0) throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    ctx.state.feed = feeds[0];
    ctx.state.feedUrl = decodeUrl(feeds[0].url);
    await next();
};
