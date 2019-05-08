const SUBSCRIBES = require('../proxies/subscribes');
const logger = require('./logger');

module.exports = async (bot, toSend, feed) => {
    const subscribers = await SUBSCRIBES.getSubscribersByFeedId(feed.feed_id);
    if (typeof toSend === 'string') {
        subscribers.map(async (subscribe) => {
            const userId = subscribe.user_id;
            try {
                await bot.telegram.sendMessage(userId, toSend, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } catch (e) {
                logger.error(e.description);
                const re = new RegExp('chat not found');
                if (re.test(e.description)) {
                    logger.error(`delete all subscribes for user ${userId}`);
                    // SUBSCRIBES.deleteSubscribersByUserId(userId);
                }
            }
        });
    } else if (Array.isArray(toSend)) {
        subscribers.map(async (subscribe) => {
            const userId = subscribe.user_id;
            let text = `<b>${feed.feed_title.trim()}</b>`;
            toSend.forEach(function(item) {
                text += `\n<a href="${item.link.trim()}">${item.title.trim()}</a>`;
            });
            try {
                await bot.telegram.sendMessage(userId, text, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } catch (e) {
                logger.error(e.description);
                const re = new RegExp('chat not found');
                if (re.test(e.description)) {
                    logger.error(`delete all subscribes for user ${userId}`);
                    // SUBSCRIBES.deleteSubscribersByUserId(userId);
                }
            }
        });
    }
};
