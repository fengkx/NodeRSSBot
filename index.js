const Telegraf = require('telegraf');
const initTable = require('./database/initTables');
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
    confirmation,
    onlyPrivateChat,
    subMultiUrl
} = require('./middlewares');

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

bot.hears(
    /^http(s)?:\/\/\w+\.\w+.*(\w|\/)/gm,
    sendError,
    async (ctx, next) => {
        ctx.state.chat = await ctx.getChat();
        if (ctx.state.chat.type === 'private') {
            await next();
        }
    },
    subMultiUrl
);

bot.command('import', async (ctx, next) => {
    ctx.reply(i18n['IMPORT_USAGE']);
    await next();
});

bot.on('document', sendError, isAdmin, getFileLink, importFromOpml);

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

bot.command(
    'allunsub',
    sendError,
    isAdmin,
    // RSS.unsubAll,
    confirmation
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

bot.command('rss', sendError, isAdmin, RSS.rss);

bot.command('export', sendError, exportToOpml);

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

bot.launch();

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
                `${feed.feed_title}: <a href="${feed.url}">${feed.url}</a> ${
                    i18n['ERROR_MANY_TIME']
                } ${err}
                `,
                feed
            );
        }
    }
});

logger.info(`Database file is in ${db_path}`);
logger.info(`Using language is ${lang}`);
logger.info(`send the latest ${item_num} items for each feed`);
logger.info('NodeRSSBot is ready');
