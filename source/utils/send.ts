import {getSubscribersByFeedId, deleteSubscribersByUserId} from '../proxies/subscribes';
import logger from "./logger";
import sanitize from "./sanitize";
import {config} from "../config";

export default async (bot, toSend: string|any[], feed) => {
    const subscribers = await getSubscribersByFeedId(feed.feed_id);
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
                    await deleteSubscribersByUserId(userId);
                }
            }
        });
    } else if (Array.isArray(toSend)) {
        subscribers.map(async (subscribe) => {
            const userId = subscribe.user_id;
            let text = `<b>${sanitize(feed.feed_title)}</b>`;
            toSend.forEach(function(item) {
                text += `\n<a href="${item.link.trim()}">${sanitize(
                    item.title
                )}</a>`;
            });
            try {
                await bot.telegram.sendMessage(userId, text, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } catch (e) {
                // bot was blocked or chat is deleted
                logger.error(e.description);
                const re = new RegExp(
                    'chat not found|bot was blocked by the user'
                );
                if (config.delete_on_err_send && re.test(e.description)) {
                    logger.error(`delete all subscribes for user ${userId}`);
                    deleteSubscribersByUserId(userId);
                }
            }
        });
    }
};
