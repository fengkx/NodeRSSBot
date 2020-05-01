import Telegraf from 'telegraf';
import initTable from './database/init-tables';
import { fork } from 'child_process';
import { join } from 'path';
import send from './utils/send';
import logger from './utils/logger';
import errors from './utils/errors';
import i18n from './i18n';

import { replyKeyboard, changeLangCallback } from './controlers/language';
import {
    getUrlById,
    rss,
    sub,
    unsub,
    unsubAll,
    viewAll,
    getActiveFeedWithErrorCount
} from './controlers/rss';
import importReply from './controlers/import-reply';
import { config } from './config';
import agent from './utils/agent';
const { token, view_all, lang, item_num, db_path, not_send } = config;

import getUrl from './middlewares/get-url';
import getUrlByTitle from './middlewares/get-url-by-title';
import getFileLink from './middlewares/get-file-link';
import sendError from './middlewares/send-error';
import testUrl from './middlewares/test-url';
import isAdmin from './middlewares/is-admin';
import onlyPrivateChat from './middlewares/only-private-chat';
import subMultiUrl from './middlewares/sub-multi-url';
import exportToOpml from './middlewares/export-to-opml';
import importFromOpml from './middlewares/import-from-opml';
import { MContext, Next } from './types/ctx';
import twoKeyReply from './utils/two-key-reply';
import {
    isChangeFeedUrl,
    isErrorMaxTime,
    isSuccess,
    Message
} from './types/message';
import { migrateUser } from './proxies/users';

(async () => {
    await initTable();
})();

const bot = new Telegraf(token, {
    telegram: {
        // Telegram options
        agent: agent?.https // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
    }
});

bot.catch((err: Error) => logger.error(err.stack || err.message));

// for handling command form group
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

bot.command('start', sendError, async (ctx: MContext) => {
    const builder = [];
    const { lang } = ctx.state;
    builder.push(i18n[lang]['WELCOME']);
    builder.push(i18n[lang]['SUB_USAGE']);
    builder.push(i18n[lang]['UNSUB_USAGE']);
    builder.push(i18n[lang]['RSS_USAGE']);
    builder.push(i18n[lang]['SEND_FILE_IMPORT']);
    builder.push(i18n[lang]['EXPORT']);
    builder.push(i18n[lang]['USB_ALL_USAGE']);
    builder.push(i18n[lang]['LANG_USAGE']);
    if (view_all) builder.push(i18n[lang]['VIEW_ALL_USAGE']);
    await ctx.replyWithMarkdown(builder.join('\n'));
});

bot.command('help', sendError, async (ctx: MContext) => {
    const builder = [];
    const { lang } = ctx.state;
    builder.push(i18n[lang]['SUB_USAGE']);
    builder.push(i18n[lang]['UNSUB_USAGE']);
    builder.push(i18n[lang]['RSS_USAGE']);
    builder.push(i18n[lang]['SEND_FILE_IMPORT']);
    builder.push(i18n[lang]['EXPORT']);
    builder.push(i18n[lang]['USB_ALL_USAGE']);
    builder.push(i18n[lang]['LANG_USAGE']);
    if (view_all) builder.push(i18n[lang]['VIEW_ALL_USAGE']);
    builder.push(
        `[https://github.com/fengkx/NodeRSSBot/blob/master/README.md](https://github.com/fengkx/NodeRSSBot/blob/master/README.md)`
    );
    await ctx.replyWithMarkdown(builder.join('\n'));
});

bot.command('sub', sendError, isAdmin, getUrl, testUrl, sub);

bot.command('unsub', sendError, isAdmin, getUrl, unsub);

bot.command('unsubthis', sendError, isAdmin, getUrlByTitle, unsub);

bot.command('rss', sendError, isAdmin, rss);

bot.command('export', sendError, isAdmin, exportToOpml);

bot.command('import', importReply);

bot.on('document', sendError, isAdmin, getFileLink, importFromOpml);

bot.on('migrate_to_chat_id', (ctx) => {
    const from = ctx.update.message.chat.id;
    const to = ctx.update.message.migrate_to_chat_id;
    migrateUser(from, to);
});

bot.command(
    'viewall',
    sendError,
    onlyPrivateChat,
    async (_ctx: MContext, next) => {
        if (view_all) await next();
        else throw errors.newCtrlErr('COMMAND_NOT_ENABLED');
    },
    viewAll
);

bot.command(
    'allunsub',
    sendError,
    isAdmin,
    // RSS.unsubAll,
    async (ctx: MContext, next) => {
        const { lang } = ctx.state;
        await twoKeyReply(
            [
                {
                    text: i18n[lang]['YES'],
                    callback_data: 'UNSUB_ALL_YES'
                },
                {
                    text: i18n[lang]['NO'],
                    callback_data: 'UNSUB_ALL_NO'
                }
            ],
            i18n[lang]['CONFIRM']
        )(ctx, next);
    }
);

bot.command('lang', sendError, isAdmin, replyKeyboard);

bot.command(
    'heath',
    sendError,
    onlyPrivateChat,
    isAdmin,
    getActiveFeedWithErrorCount
);

bot.action(/^CHANGE_LANG[\w_]+/, changeLangCallback);

bot.hears(
    /(((https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/gm,
    async (ctx: MContext, next) => {
        if (!ctx.message.text.startsWith('/')) {
            await next();
        }
    },
    sendError,
    async (ctx: MContext, next: Next) => {
        ctx.state.chat = await ctx.getChat();
        if (ctx.state.chat.type === 'private') {
            await next();
        }
    },
    subMultiUrl
);

bot.hears(/^\[(\d+)] (.+)/, sendError, isAdmin, getUrlById, unsub);

bot.action(
    'UNSUB_ALL_YES',
    sendError,
    isAdmin,
    unsubAll,
    async (ctx: MContext, next) => {
        const cb = ctx.callbackQuery;
        // @ts-ignore
        ctx.telegram.answerCbQuery(cb.id);
        await next();
    }
);

bot.action('UNSUB_ALL_NO', async (ctx: MContext, next) => {
    const cb = ctx.callbackQuery;
    // @ts-ignore
    ctx.telegram.answerCbQuery(cb.id, i18n[lang]['CANCEL']);
    await ctx.telegram.deleteMessage(cb.message.chat.id, cb.message.message_id);
    await next();
});

bot.action(
    /^VIEWALL_(\d+)/,
    sendError,
    onlyPrivateChat,
    async (ctx: MContext, next) => {
        const cb = ctx.callbackQuery;
        ctx.state.viewallPage = parseInt(cb.data.split('_')[1]);
        await ctx.telegram.deleteMessage(
            cb.message.chat.id,
            cb.message.message_id
        );
        await next();
    },
    viewAll
);

bot.action(
    /^RSS_(RAW_)*(\d+)/,
    sendError,
    onlyPrivateChat,
    async (ctx: MContext, next) => {
        const cb = ctx.callbackQuery;
        const splitedStr = cb.data.split('_');
        if (splitedStr[1] === 'RAW') ctx.state.showRaw = true;
        ctx.state.rssPage = parseInt(splitedStr[splitedStr.length - 1]);
        await ctx.telegram.deleteMessage(
            cb.message.chat.id,
            cb.message.message_id
        );
        await next();
    },
    rss
);

bot.launch();

function startFetchProcess(restartTime: number): void {
    if (restartTime > 3) {
        logger.error('fetch process exit too much(3) times');
        process.exit(1);
    }
    const fetchJS = join(__dirname, `utils/fetch.js`);
    const child = process.env.NODE_PRODUTION
        ? fork(fetchJS)
        : fork(fetchJS, [], {
              execArgv: ['--inspect-brk=46209']
          });
    child.on('message', function (message: Message | string) {
        if (typeof message === 'string') logger.info(message);
        else if (isSuccess(message)) {
            const { sendItems, feed } = message;
            if (sendItems.length > 0 && !not_send) send(bot, sendItems, feed);
        } else {
            if (isErrorMaxTime(message)) {
                const { feed, err } = message;
                send(
                    bot,
                    `${feed.feed_title}: <a href="${feed.url}">${feed.url}</a> ${i18n[lang]['ERROR_MANY_TIME']} ${err.message}`,
                    feed
                );
            }
            if (isChangeFeedUrl(message)) {
                const { feed, new_feed } = message;
                const builder = [];
                builder.push(
                    `${feed.feed_title}: <a href="${encodeURI(
                        feed.url
                    )}"></a> ${i18n[lang]['ERROR_MANY_TIME']}`
                ); // feed is from database which not urlencoded
                builder.push(`<b>${i18n[lang]['FOUND_FEEDS']}</b>:`);
                builder.push(...new_feed);
                builder.push(`${i18n[lang]['FEED_CHANGE_TO']} ${new_feed[0]}`);
                send(bot, builder.join('\n'), feed);
            }
        }
    });

    child.on('exit', function (code, signal) {
        logger.error(`child process exit`);
        logger.error({
            code,
            signal
        });
        startFetchProcess(restartTime + 1);
    });
}

startFetchProcess(0);

logger.info(`Database file is in ${db_path}`);
logger.info(`Using Default language is ${lang}`);
logger.info(`send the latest ${item_num} items for each feed`);
logger.info('NodeRSSBot is ready');
