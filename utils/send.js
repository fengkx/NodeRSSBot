const SUBSCRIBES = require('../proxies/subscribes');

module.exports = async (bot, toSend, feed) => {
    const subscribers = await SUBSCRIBES.getSubscribersByFeedId(feed.feed_id);
    if(typeof toSend === "string") {
        subscribers.map(async subscribe => {
            const userId = subscribe.user_id;
            bot.telegram.sendMessage(userId, toSend, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        })
    } else if(Array.isArray(toSend)) {
        subscribers.map(async subscribe => {
            const userId = subscribe.user_id;
            let text = `<b>${feed.feed_title.trim()}</b>`;
            toSend.forEach(function (item) {
                text += `\n<a href="${item.link.trim()}">${item.title.trim()}</a>`
            });
            bot.telegram.sendMessage(userId, text, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        })
    }
};
