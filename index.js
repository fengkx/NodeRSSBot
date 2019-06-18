// eslint-disable-next-line no-unused-vars
const heapdump = require('heapdump');
const Telegraf = require('telegraf');
const initTable = require('./database/init-tables');
const RSS = require('./controlers/rss');
const { fork } = require('child_process');
const send = require('./utils/send');
const logger = require('./utils/logger');
const errors = require('./utils/errors');
const i18n = require('./i18n');
const USERS = require('./proxies/users');
const {
    token,
    view_all,
    lang,
    item_num,
    db_path,
    not_send
} = require('./config');

const {
    getUrl,
    exportToOpml,
    importFromOpml,
    getFileLink,
    sendError,
    testUrl,
    getUrlByTitle,
    isAdmin,
    onlyPrivateChat,
    subMultiUrl
} = require('./middlewares');

const twoKeyReply = require('./utils/two-key-reply');

(async () => {
    await initTable();
})();

const bot = new Telegraf(token, {
    telegram: {
        // Telegram options
        agent: require('./utils/agent') // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
    }
});

bot.catch((err) => logger.error(err));

// for handling command form group
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

bot.command('start', async (ctx) => {
    let builder = [];
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

bot.command('help', async (ctx) => {
    let builder = [];
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

bot.command('sub', sendError, isAdmin, getUrl, testUrl, RSS.sub);

bot.command('unsub', sendError, isAdmin, getUrl, RSS.unsub);

bot.command('unsubthis', sendError, isAdmin, getUrlByTitle, RSS.unsub);

bot.command('rss', sendError, isAdmin, RSS.rss);

bot.command('export', sendError, isAdmin, exportToOpml);

bot.command('import', async (ctx, next) => {
    ctx.reply(i18n[lang]['IMPORT_USAGE']);
    await next();
});

bot.on('document', sendError, isAdmin, getFileLink, importFromOpml);

bot.command(
    'viewall',
    sendError,
    onlyPrivateChat,
    async (ctx, next) => {
        if (view_all) await next();
        else throw errors.newCtrlErr('COMMAND_NOT_ENABLED');
    },
    RSS.viewAll
);

bot.command(
    'allunsub',
    sendError,
    isAdmin,
    // RSS.unsubAll,
    async (ctx, next) => {
        const { lang } = ctx.state;
        await twoKeyReply(i18n[lang]['CONFIRM'], [
            {
                text: i18n[lang]['YES'],
                callback_data: 'UNSUB_ALL_YES'
            },
            {
                text: i18n[lang]['NO'],
                callback_data: 'UNSUB_ALL_NO'
            }
        ])(ctx, next);
    }
);

bot.command('lang', sendError, isAdmin, async (ctx, next) => {
    const kbs = Object.keys(i18n).map((i) => {
        return {
            text: i,
            callback_data: `CHANGE_LANG_${i}_${ctx.state.chat.id}`
        };
    });
    await ctx.telegram.sendMessage(
        ctx.chat.id,
        i18n[ctx.state.lang]['CHOOSE_LANG'],
        {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [[...kbs]]
            }
        }
    );
    await next();
});

bot.action(/^CHANGE_LANG[\w_]+/, async (ctx, next) => {
    const cb = ctx.callbackQuery;
    const data = cb.data.split('_');
    const lang = data[data.length - 2];
    const id = data[data.length - 1];
    await USERS.setLangById(id, lang);
    ctx.telegram.answerCbQuery(cb.id, i18n[lang]['SET_LANG_TO'] + ' ' + lang);
    await ctx.telegram.deleteMessage(cb.message.chat.id, cb.message.message_id);
    await next();
});

bot.hears(
    /(((https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/gm,
    async (ctx, next) => {
        if (!ctx.message.text.startsWith('/')) {
            await next();
        }
    },
    sendError,
    async (ctx, next) => {
        ctx.state.chat = await ctx.getChat();
        if (ctx.state.chat.type === 'private') {
            await next();
        }
    },
    subMultiUrl
);

bot.action(
    'UNSUB_ALL_YES',
    sendError,
    isAdmin,
    RSS.unsubAll,
    async (ctx, next) => {
        const cb = ctx.callbackQuery;
        ctx.telegram.answerCbQuery(cb.id);
        await next();
    }
);

bot.action('UNSUB_ALL_NO', async (ctx, next) => {
    const cb = ctx.callbackQuery;
    ctx.telegram.answerCbQuery(cb.id, i18n[lang]['CANCEL']);
    await ctx.telegram.deleteMessage(cb.message.chat.id, cb.message.message_id);
    await next();
});

bot.action(
    /^VIEWALL_(\d+)/,
    sendError,
    onlyPrivateChat,
    async (ctx, next) => {
        const cb = ctx.callbackQuery;
        ctx.state.viewallPage = parseInt(cb.data.split('_')[1]);
        await ctx.telegram.deleteMessage(
            cb.message.chat.id,
            cb.message.message_id
        );
        await next();
    },
    RSS.viewAll
);

bot.action(
    /^RSS_(RAW_)*(\d+)/,
    sendError,
    onlyPrivateChat,
    async (ctx, next) => {
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
    RSS.rss
);

bot.launch();

function startFetchProcess(restartTime) {
    if (restartTime > 3) {
        logger.error('fetch process exit to much');
        process.exit(1);
    }
    let child = process.env.NODE_PRODUTION
        ? fork(`utils/fetch.js`)
        : fork(`utils/fetch.js`, [], {
              execArgv: ['--inspect-brk=46209']
          });
    child.on('message', function(message) {
        if (typeof message === 'string') logger.info(message);
        else if (message.success) {
            const feed = message.eachFeed;
            const { sendItems } = message;
            if (sendItems.length > 0 && !not_send) send(bot, sendItems, feed);
        } else {
            if (message.message === 'MAX_TIME') {
                const { feed, err } = message;
                send(
                    bot,
                    `${feed.feed_title}: <a href="${feed.url}">${
                        feed.url
                    }</a> ${i18n[lang]['ERROR_MANY_TIME']} ${err}`,
                    feed
                );
            }
            if (message.message === 'CHANGE') {
                const { feed, new_feed } = message;
                const builder = [];
                builder.push(
                    `${feed.feed_title}: <a href="${feed.url}"></a> ${
                        i18n[lang]['ERROR_MANY_TIME']
                    }`
                );
                builder.push(`<b>${i18n[lang]['FOUND_FEEDS']}</b>:`);
                builder.push(...new_feed);
                builder.push(`${i18n[lang]['FEED_CHANGE_TO']} ${new_feed[0]}`);
                send(bot, builder.join('\n'), feed);
            }
        }
    });

    child.on('exit', function(code, signal) {
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
logger.info(`Using language is ${lang}`);
logger.info(`send the latest ${item_num} items for each feed`);
logger.info('NodeRSSBot is ready');
