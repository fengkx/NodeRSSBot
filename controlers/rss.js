const ctrl = {};
const RSS = require('../proxies/rssFeed');
const i18n = require('../i18n');
const twoKeyReply = require('../utils/two-key-reply');

ctrl.sub = async (ctx, next) => {
    const { feedUrl, chat } = ctx.state;
    const feedTitle = ctx.state.feed.title;
    const userId = chat.id;
    try {
        const res = await RSS.sub(userId, feedUrl, feedTitle);
        if (res === 'ok') {
            await ctx.telegram.deleteMessage(
                ctx.state.chat.id,
                ctx.state.processMesId
            );
            ctx.state.processMesId = null;
            ctx.replyWithMarkdown(`
            ${i18n['SUB_SUCCESS']}[${ctx.state.feed.title}](${
                ctx.state.feedUrl
            })`);
        }
    } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error('DB_ERROR');
    }
    await next();
};

ctrl.unsub = async (ctx, next) => {
    const { feedUrl, chat } = ctx.state;
    const userId = chat.id;
    try {
        const feed = await RSS.getFeedByUrl(feedUrl);
        if (!feed) throw new Error('DID_NOT_SUB');
        const res = await RSS.unsub(userId, feed.feed_id);
        if (res === 'ok') {
            await ctx.telegram.deleteMessage(
                ctx.state.chat.id,
                ctx.state.processMesId
            );
            ctx.state.processMesId = null;
            ctx.replyWithMarkdown(`
        ${i18n['UNSUB_SUCCESS']}[${feed.feed_title}](${encodeURI(
                ctx.state.feedUrl
            )})`);
        }
    } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error('DB_ERROR');
    }
    await next();
};

ctrl.rss = async (ctx, next) => {
    const limit = 50;
    const page = ctx.state.rssPage || 1;
    const hasRaw = ctx.message && ctx.message.text.split(/\s/)[1] === 'raw';
    const raw = hasRaw || ctx.state.showRaw;
    const rawStr = raw ? 'RAW_' : '';

    const userId = ctx.state.chat.id;
    const count = await RSS.getSubscribedCountByUserId(userId);
    const kbs = [
        {
            text: i18n['PAGE_PRE'],
            callback_data: 'RSS_' + rawStr + (page - 1)
        },
        {
            text: i18n['PAGE_NEXT'],
            callback_data: 'RSS_' + rawStr + (page + 1)
        }
    ];
    if (count < page * limit) kbs.pop();
    if (page === 1) kbs.shift();
    const feeds = await RSS.getSubscribedFeedsByUserId(userId, limit, page);
    if (feeds.length === 0) {
        throw new Error('NOT_SUB');
    }
    let builder = [];
    builder.push(`<strong>${i18n['SUB_LIST']}</strong>`);
    if (raw) {
        feeds.forEach((feed) => {
            builder.push(
                `${feed.feed_title.trim()}: <a href="${feed.url.trim()}">${decodeURI(
                    feed.url.trim()
                )}</a>`
            );
        });
    } else {
        feeds.forEach((feed) => {
            builder.push(
                `<a href="${feed.url.trim()}">${feed.feed_title.trim()}</a>`
            );
        });
    }
    await twoKeyReply(builder.join('\n'), kbs)(ctx, next);
    await next();
};

ctrl.unsubAll = async (ctx, next) => {
    const userId = ctx.state.chat.id;
    await RSS.unsubAll(userId);
    await ctx.telegram.sendMessage(
        ctx.state.chat.id,
        i18n['UNSUB_ALL_SUCCESS'],
        {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        }
    );
    await next();
};

ctrl.viewAll = async (ctx, next) => {
    const limit = 50;
    const page = ctx.state.viewallPage || 1;
    const count = await RSS.getAllFeedsCount();
    const kbs = [
        {
            text: i18n['PAGE_PRE'],
            callback_data: 'VIEWALL_' + (page - 1)
        },
        {
            text: i18n['PAGE_NEXT'],
            callback_data: 'VIEWALL_' + (page + 1)
        }
    ];
    if (count < page * limit) kbs.pop();
    if (page === 1) kbs.shift();
    const feeds = await RSS.getAllFeedsWithCount(limit, page);
    if (feeds.length === 0) {
        throw new Error('NOT_SUB');
    }
    let builder = [];
    builder.push(`<strong>${i18n['ALL_FEED']}</strong>`);
    feeds.forEach((feed) => {
        const url = feed.url.trim();
        const title = feed.feed_title.trim();
        builder.push(
            `<a href="${url}">${title}</a>  ${i18n['NUMBER_OF_SUBSCRIBER']}: ${
                feed.sub_count
            }`
        );
    });
    ctx.state.replyText = builder.join('\n');
    await twoKeyReply(kbs)(ctx, next);
    await next();
};

module.exports = ctrl;
