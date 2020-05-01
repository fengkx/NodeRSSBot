import * as RSS from '../proxies/rss-feed';
import i18n from '../i18n';
import twoKeyReply from '../utils/two-key-reply';
import errors from '../utils/errors';
import { MContext, Next } from '../types/ctx';
import { isNone } from '../types/option';

export async function sub(ctx: MContext, next: Next) {
    const { feedUrl, chat, lang } = ctx.state;
    const feedTitle = ctx.state.feed.feed_title;
    const userId = chat.id;
    try {
        await RSS.sub(userId, feedUrl, feedTitle);
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.state.processMsgId);
        ctx.state.processMsgId = null;
        ctx.replyWithMarkdown(`
        ${i18n[lang]['SUB_SUCCESS']} [${ctx.state.feed.feed_title}](${ctx.state.feedUrl})`);
    } catch (e) {
        if (e instanceof errors.ControllableError) throw e;
        throw errors.newCtrlErr('DB_ERROR', e);
    }
    await next();
}

export async function unsub(ctx: MContext, next: Next) {
    const { feedUrl, chat, lang } = ctx.state;
    const userId = chat.id;
    try {
        const feed = await RSS.getFeedByUrl(feedUrl);
        if (isNone(feed)) throw errors.newCtrlErr('DID_NOT_SUB');
        await RSS.unsub(userId, feed.value.feed_id);

        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.state.processMsgId);
        ctx.state.processMsgId = null;
        ctx.replyWithMarkdown(
            `
        ${i18n[lang]['UNSUB_SUCCESS']} [${feed.value.feed_title}](${encodeURI(
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
}

export async function rss(ctx: MContext, next: Next) {
    const limit = 50;
    const page = ctx.state.rssPage || 1;
    const hasRaw = ctx.message?.text.split(/\s/)[1] === 'raw';
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
    const builder = [];

    builder.push(`<strong>${i18n[lang]['SUB_LIST']}</strong>`);
    if (raw) {
        feeds.forEach((feed) => {
            builder.push(
                `${feed.feed_title.trim()}: <a href="${encodeURI(
                    feed.url.trim()
                )}">${decodeURI(feed.url.trim())}</a>`
            );
        });
    } else {
        feeds.forEach((feed) => {
            builder.push(
                `<a href="${encodeURI(
                    feed.url.trim()
                )}">${feed.feed_title.trim()}</a>`
            );
        });
    }
    await twoKeyReply(kbs, builder.join('\n'))(ctx, next);
}

export async function unsubAll(ctx: MContext, next: Next) {
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
}

export async function viewAll(ctx: MContext, next: Next) {
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
    const builder = [];
    builder.push(`<strong>${i18n[lang]['ALL_FEED']}</strong>`);
    feeds.forEach((feed) => {
        const url = feed.url.trim();
        const title = feed.feed_title.trim();
        builder.push(
            `<a href="${encodeURI(url)}">${title}</a>  ${
                i18n[lang]['NUMBER_OF_SUBSCRIBER']
            }: ${feed.sub_count}`
        );
    });
    ctx.state.replyText = builder.join('\n');
    await twoKeyReply(kbs)(ctx, next);
}

export async function getUrlById(ctx: MContext, next: Next) {
    const { text } = ctx.message;
    const feed_id = text.match(/^\[(\d+)] (.+)/)[1];
    const feed = await RSS.getFeedById(parseInt(feed_id));
    ctx.state.feedUrl = decodeURI(feed.url);
    await next();
}

export async function getActiveFeedWithErrorCount(ctx: MContext, next: Next) {
    const feedsWithErrorCount = await RSS.getActiveFeedWithErrorCount();
    const count = feedsWithErrorCount.reduce((acc, cur) => {
        if (cur.error_count > 1000) {
            return acc + 1;
        }
        return acc;
    }, 0);
    const heath = `heath: ${
        i18n[ctx.state.lang]['ACTIVE_FEED_COUNT_WITH_ERROR']
    }: ${count} ${i18n[ctx.state.lang]['TOTAL_ACTIVE_FEED_COUNT']}: ${
        feedsWithErrorCount.length
    }`;
    ctx.reply(heath);
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.state.processMsgId);
    ctx.state.processMsgId = null;
    await next();
}

export async function cleanUpErrorFeed(ctx: MContext, next: Next) {
    const feedToCleanUp = await RSS.getActiveFeedWithErrorCount(10);
    await RSS.batchUnsubByFeedIds(feedToCleanUp.map((f) => f.feed_id));
    ctx.reply('Clean up');
    await next();
}
