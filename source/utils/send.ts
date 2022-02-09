import {
    getSubscribersByFeedId,
    deleteSubscribersByUserId
} from '../proxies/subscribes';
import logger from './logger';
import sanitize from './sanitize';
import { config } from '../config';
import { Telegraf, Context } from 'telegraf';
import { Feed, FeedItem } from '../types/feed';
import { getUserById, migrateUser } from '../proxies/users';
import { isNone, isSome } from '../types/option';
import * as ejs from 'ejs';
import i18n from '../i18n';

/**
 * handle send error log or delete user or migrate user
 * @param e the error that handle
 * @param userId user_id that this error occur
 * @return whether to send again
 */
async function handlerSendError(e: any, userId: number): Promise<boolean> {
    // bot was blocked or chat is deleted
    logger.error(e);
    if (config.delete_on_err_send && isChatUnAvailable(e.description)) {
        logger.error(`delete all subscribes for user ${userId}`);
        deleteSubscribersByUserId(userId);
    }
    if (
        e.description ===
        'Bad Request: group chat was upgraded to a supergroup chat'
    ) {
        const from = userId;
        const to = e.parameters.migrate_to_chat_id;
        const user = await getUserById(to);
        if (isNone(user)) {
            await migrateUser(from, to);
            return true;
        } else {
            deleteSubscribersByUserId(from);
        }
    }
    return false;
}

const send = async (
    bot: Telegraf<Context>,
    toSend: NonNullable<string | FeedItem[]>,
    feed: Feed
): Promise<void> => {
    const subscribers = await getSubscribersByFeedId(feed.feed_id);
    if (typeof toSend === 'string') {
        const tpl = toSend;
        subscribers.map(async (subscribe) => {
            const userId = subscribe.user_id;
            try {
                const user = await getUserById(userId);
                let lang = config.lang;
                if (isSome(user)) {
                    lang = user.value.lang;
                }
                toSend = ejs.render(tpl, { i18n: i18n[lang] });
                await bot.telegram.sendMessage(userId, toSend, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            } catch (e) {
                handlerSendError(e, userId);
            }
        });
    } else {
        const feedItems = toSend;
        subscribers.map(async (subscribe) => {
            const userId = subscribe.user_id;
            let text = `<b>${sanitize(feed.feed_title)}</b>`;
            feedItems.forEach(function (item) {
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
                const resend = await handlerSendError(e, userId);
                if (resend && e.parameters?.migrate_to_chat_id) {
                    await bot.telegram.sendMessage(
                        e.parameters.migrate_to_chat_id,
                        text,
                        {
                            parse_mode: 'HTML',
                            disable_web_page_preview: true
                        }
                    );
                }
            }
        });
    }
};

function isChatUnAvailable(description: string): boolean {
    const re =
        /chat not found|bot was blocked by the user|bot was kicked|user is deactivated|have no rights|need administrator rights/;
    return re.test(description);
}

export default send;
