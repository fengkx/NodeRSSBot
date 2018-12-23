const Telegraf = require('telegraf');
const {token} = require('./config');
const agent = require('./utils/agent');
const initTable = require('./database/initTables');
const RSS = require('./controlers/rss');
const {fork} = require('child_process');
const send = require('./utils/send');
const logger = require('./utils/logger');
const i18n = require('./i18n');

const {
    getUrl,
    exportToOpml,
    importFromOpml,
    getFileLink,
    sendError,
    testUrl,
    getUrlByTitle,
    isAdmin,
    confirmation
} = require('./middlewares');


(async () => {
    await initTable();
})();

const bot = new Telegraf(token, {
    telegram: {           // Telegram options
        // agent: agent,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
    }
});

bot.catch((err) => logger.error(err));

// for handling command form group
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username
});

bot.on('document',
    sendError,
    isAdmin,
    getFileLink,
    importFromOpml
);

bot.command('start', async (ctx) => {
    let text = i18n['WELCOME'];
    text += `\n${i18n['SUB_USAGE']}`
    text += `\n${i18n['UNSUB_USAGE']}`
    text += `\n${i18n['RSS_USAGE']}`
    text += `\n${i18n['SEND_FILE_IMPORT']}`
    text += `\n${i18n['EXPORT']}`
    text += `\n${i18n['USB_ALL_USAGE']}`
    await ctx.replyWithMarkdown(text);
});

bot.command('sub',
    sendError,
    isAdmin,
    getUrl,
    testUrl,
    RSS.sub
);

bot.command('unsub',
    sendError,
    isAdmin,
    getUrl,
    RSS.unsub
);

bot.command('unsubthis',
    sendError,
    isAdmin,
    getUrlByTitle,
    RSS.unsub
);

bot.command('allunsub',
    sendError,
    isAdmin,
    // RSS.unsubAll,
    confirmation
);

bot.action('UNSUB_ALL_YES',
    sendError,
    isAdmin,
    RSS.unsubAll,
    async (ctx, next) => {
        const cb = ctx.callbackQuery;
        const res = await ctx.telegram.answerCbQuery();
    }
);

bot.action('UNSUB_ALL_NO', async (ctx, next) => {
    const cb = ctx.callbackQuery;
    const res = await ctx.telegram.answerCbQuery(cb.id, i18n['CANCEL']);
    await ctx.telegram.deleteMessage(cb.from.id , cb.message.message_id);
});

bot.command('rss',
    sendError,
    isAdmin,
    RSS.rss
);

bot.command('export',
    sendError,
    exportToOpml
);

bot.startPolling();

const chid = fork(`utils/fetch.js`);
chid.on('message', function (message) {
    if (typeof message === "string")
        logger.info(message);
    else if (message.success) {
        const feed = message.eachFeed;
        const {sendItems} = message;
        if (sendItems.length > 0)
            send(bot, sendItems, feed)
    } else {
        if (message.message === 'MAX_TIME') {
            const {feed} = message;
            send(bot,
                `${feed.feed_title}: <a href="${feed.url}">${feed.url}</a> ${i18n['ERROR_MANY_TIME']}`,
                feed
            )
        }
    }
});

logger.info('NodeRSSBot is ready');
