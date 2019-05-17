const Telegraf = require('telegraf');
const initTable = require('./database/init-tables');
const RSS = require('./controlers/rss');
const { fork } = require('child_process');
const send = require('./utils/send');
const logger = require('./utils/logger');
const i18n = require('./i18n');
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
const confirmation = twoKeyReply(i18n['CONFIRM'], [
    {
        text: i18n['YES'],
        callback_data: 'UNSUB_ALL_YES'
    },
    {
        text: i18n['NO'],
        callback_data: 'UNSUB_ALL_NO'
    }
]);

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
    builder.push(i18n['WELCOME']);
    builder.push(i18n['SUB_USAGE']);
    builder.push(i18n['UNSUB_USAGE']);
    builder.push(i18n['RSS_USAGE']);
    builder.push(i18n['SEND_FILE_IMPORT']);
    builder.push(i18n['EXPORT']);
    builder.push(i18n['USB_ALL_USAGE']);
    if (view_all) builder.push(i18n['VIEW_ALL_USAGE']);
    await ctx.replyWithMarkdown(builder.join('\n'));
});

bot.command('help', async (ctx) => {
    let builder = [];
    builder.push(i18n['SUB_USAGE']);
    builder.push(i18n['UNSUB_USAGE']);
    builder.push(i18n['RSS_USAGE']);
    builder.push(i18n['SEND_FILE_IMPORT']);
    builder.push(i18n['EXPORT']);
    builder.push(i18n['USB_ALL_USAGE']);
    if (view_all) builder.push(i18n['VIEW_ALL_USAGE']);
    await ctx.replyWithMarkdown(builder.join('\n'));
});

bot.command('sub', sendError, isAdmin, getUrl, testUrl, RSS.sub);

bot.command('unsub', sendError, isAdmin, getUrl, RSS.unsub);

bot.command('unsubthis', sendError, isAdmin, getUrlByTitle, RSS.unsub);

bot.command('rss', sendError, isAdmin, RSS.rss);

bot.command('export', sendError, isAdmin, exportToOpml);

bot.command('import', async (ctx, next) => {
    ctx.reply(i18n['IMPORT_USAGE']);
    await next();
});

bot.on('document', sendError, isAdmin, getFileLink, importFromOpml);

bot.command(
    'viewall',
    sendError,
    onlyPrivateChat,
    async (ctx, next) => {
        if (view_all) await next();
        else throw new Error('COMMAND_NOT_ENABLED');
    },
    RSS.viewAll
);

bot.command(
    'allunsub',
    sendError,
    isAdmin,
    // RSS.unsubAll,
    confirmation
);

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
    ctx.telegram.answerCbQuery(cb.id, i18n['CANCEL']);
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
    const chid = fork(`utils/fetch.js`);
    chid.on('message', function(message) {
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
                    }</a> ${i18n['ERROR_MANY_TIME']} ${err}
                `,
                    feed
                );
            }
        }
    });

    chid.on('exit', function(code, signal) {
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
