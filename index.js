const Telegraf = require('telegraf');
const {token} = require('./config');
const agent = require('./utils/agent');
const initTable = require('./database/initTables');
const getUrl = require('./middlewares/getUrl');
const getUrlByTitle = require('./middlewares/getUrlByTitle');
const testUrl = require('./middlewares/testUrl');
const sendErro = require('./middlewares/sendError');
const RSS = require('./controlers/rss');
const {isAdmin} = require('./middlewares/permission');
const {fork} = require('child_process');
const send = require('./utils/send');
const logger = require('./utils/logger');
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
})


bot.command('sub',
    sendErro,
    isAdmin,
    getUrl,
    testUrl,
    RSS.sub
);

bot.command('unsub',
    sendErro,
    isAdmin,
    getUrl,
    RSS.unsub
);

bot.command('unsubthis',
    sendErro,
    isAdmin,
    getUrlByTitle,
    RSS.unsub
);

bot.command('rss',
    sendErro,
    isAdmin,
    RSS.rss
);

bot.startPolling();

const chid = fork(`utils/fetch.js`);
chid.on('message', function (message) {
    if (typeof message === "string")
        logger.info(message);
    else if (message instanceof Error) {
        logger.error("ERROR:" + e.stack);
    } else {
        const feed = message.eachFeed;
        const {sendItems} = message;
        if (sendItems.length > 0)
            send(bot, sendItems, feed)
    }
});

logger.info('NodeRSSBot is ready')
