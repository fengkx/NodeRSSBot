const ctrl = {};
const RSS = require('../proxies/rss-feed');
const i18n = require('../i18n');
const twoKeyReply = require('../utils/two-key-reply');
const errors = require('../utils/errors');

ctrl.sub = async (ctx, next) => {
    const { feedUrl, chat, lang } = ctx.state;
    const feedTitle = ctx.state.feed.title;
    const userId = chat.id;
    try {
        await RSS.sub(userId, feedUrl, feedTitle);
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.state.processMesId);
        ctx.state.processMesId = null;
        ctx.replyWithMarkdown(`
        ${i18n[lang]['SUB_SUCCESS']} [${ctx.state.feed.title}](${
            ctx.state.feedUrl
        })`);
    } catch (e) {
        if (e instanceof errors.ControllableError) throw e;
        throw errors.newCtrlErr('DB_ERROR', e);
    }
    await next();
};

ctrl.unsub = async (ctx, next) => {
    const { feedUrl, chat, lang } = ctx.state;
    const userId = chat.id;
    try {
        const feed = await RSS.getFeedByUrl(feedUrl);
        if (!feed) throw errors.newCtrlErr('DID_NOT_SUB');
        await RSS.unsub(userId, feed.feed_id);

        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.state.processMesId);
        ctx.state.processMesId = null;
        ctx.replyWithMarkdown(
            `
        ${i18n[lang]['UNSUB_SUCCESS']} [${feed.feed_title}](${encodeURI(
                ctx.state.feedUrl
            )})`,
            {
                reply_markup: {
                    remove_keyboard: true
                }
            }
        );
    } catch (e) {
        if (e instanceof errors.ControllableError) throw e;
        throw errors.newCtrlErr('DB_ERROR', e);
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
    const { lang } = ctx.state;
    const kbs = [
        {
            text: i18n[lang]['PAGE_PRE'],
            callback_data: 'RSS_' + rawStr + (page - 1)
        },
        {
            text: i18n[lang]['PAGE_NEXT'],
            callback_data: 'RSS_' + rawStr + (page + 1)
        }
    ];
    if (count < page * limit) kbs.pop();
    if (page === 1) kbs.shift();
    const feeds = await RSS.getSubscribedFeedsByUserId(userId, limit, page);
    if (feeds.length === 0) {
        throw errors.newCtrlErr('NOT_SUB');
    }
    let builder = [];

    builder.push(`<strong>${i18n[lang]['SUB_LIST']}</strong>`);
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
};

ctrl.unsubAll = async (ctx, next) => {
    const userId = ctx.state.chat.id;
    const lang = ctx.state.lang;
    await RSS.unsubAll(userId);
    await ctx.telegram.sendMessage(
        ctx.chat.id,
        i18n[lang]['UNSUB_ALL_SUCCESS'],
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
    const { lang } = ctx.state;
    const kbs = [
        {
            text: i18n[lang]['PAGE_PRE'],
            callback_data: 'VIEWALL_' + (page - 1)
        },
        {
            text: i18n[lang]['PAGE_NEXT'],
            callback_data: 'VIEWALL_' + (page + 1)
        }
    ];
    if (count < page * limit) kbs.pop();
    if (page === 1) kbs.shift();
    const feeds = await RSS.getAllFeedsWithCount(limit, page);
    if (feeds.length === 0) {
        throw errors.newCtrlErr('NOT_SUB');
    }
    let builder = [];
    builder.push(`<strong>${i18n[lang]['ALL_FEED']}</strong>`);
    feeds.forEach((feed) => {
        const url = feed.url.trim();
        const title = feed.feed_title.trim();
        builder.push(
            `<a href="${url}">${title}</a>  ${
                i18n[lang]['NUMBER_OF_SUBSCRIBER']
            }: ${feed.sub_count}`
        );
    });
    ctx.state.replyText = builder.join('\n');
    await twoKeyReply(kbs)(ctx, next);
};

ctrl.getUrlById = async (ctx, next) => {
    const { text } = ctx.message;
    const feed_id = text.match(/^\[(\d+)] (.+)/)[1];
    const feed = await RSS.getFeedById(feed_id);
    ctx.state.feedUrl = decodeURI(feed.url);
    await next();
};

module.exports = ctrl;
