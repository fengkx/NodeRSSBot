const { getFeedsByTitle } = require('../proxies/rss-feed');
const errors = require('../utils/errors');

module.exports = async (ctx, next) => {
    const me = await ctx.telegram.getMe();
    const myId = me.id;
    const replyToMessage = ctx.message.reply_to_message;
    if (!replyToMessage || replyToMessage.from.id !== myId) {
        throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    }
    const title = replyToMessage.text.split('\n')[0];
    let feeds = await getFeedsByTitle(title);
    if (feeds.length > 1) throw errors.newCtrlErr('SAME_NAME');
    if (feeds.length === 0) throw errors.newCtrlErr('UNSUBTHIS_USAGE');
    ctx.state.feed = feeds[0];
    ctx.state.feedUrl = decodeURI(feeds[0].url);
    await next();
};
