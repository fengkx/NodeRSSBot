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
import { RateLimit, Sema } from 'async-sema';

const sendSlots = new Sema(config.send_concurrency);
const sendRateLimit = RateLimit(config.send_rate, {
    uniformDistribution: true
});
let pendingSendJobs = 0;
let activeSendJobs = 0;

type SendMessageOptions = Parameters<
    Telegraf<Context>['telegram']['sendMessage']
>[2];

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterSeconds(e: any): number | undefined {
    const retryAfter = e?.parameters?.retry_after;
    return typeof retryAfter === 'number' && retryAfter > 0
        ? retryAfter
        : undefined;
}

export function getSendRuntimeState(): {
    sendConcurrency: number;
    sendRate: number;
    pendingSendJobs: number;
    activeSendJobs: number;
    backlogSendJobs: number;
    semaphoreWaiting: number;
} {
    return {
        sendConcurrency: config.send_concurrency,
        sendRate: config.send_rate,
        pendingSendJobs,
        activeSendJobs,
        backlogSendJobs: Math.max(0, pendingSendJobs - activeSendJobs),
        semaphoreWaiting: sendSlots.nrWaiting()
    };
}

const backlogLogTimer = setInterval(() => {
    const state = getSendRuntimeState();
    if (state.pendingSendJobs > 0 || state.backlogSendJobs > 0) {
        logger.info({
            message: 'telegram send backlog',
            ...state
        });
    }
}, 30 * 1000);
backlogLogTimer.unref?.();

async function runWithSendLimit<T>(job: () => Promise<T>): Promise<T> {
    pendingSendJobs += 1;
    try {
        await sendRateLimit();
        const token = await sendSlots.acquire();
        activeSendJobs += 1;
        try {
            return await job();
        } finally {
            activeSendJobs -= 1;
            sendSlots.release(token);
        }
    } finally {
        pendingSendJobs -= 1;
    }
}

async function sendMessageWithLimit(
    bot: Telegraf<Context>,
    userId: number,
    text: string,
    options: SendMessageOptions
): Promise<void> {
    try {
        await runWithSendLimit(() =>
            bot.telegram.sendMessage(userId, text, options)
        );
    } catch (e) {
        const retryAfter = getRetryAfterSeconds(e);
        if (retryAfter === undefined) {
            throw e;
        }
        logger.info({
            message: 'telegram send rate limited',
            retryAfter,
            userId,
            ...getSendRuntimeState()
        });
        await sleep((retryAfter + 1) * 1000);
        await runWithSendLimit(() =>
            bot.telegram.sendMessage(userId, text, options)
        );
    }
}

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
        await deleteSubscribersByUserId(userId);
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
            await deleteSubscribersByUserId(from);
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
        await Promise.all(
            subscribers.map(async (subscribe) => {
                const userId = subscribe.user_id;
                try {
                    const user = await getUserById(userId);
                    let lang = config.lang;
                    if (isSome(user)) {
                        lang = user.value.lang;
                    }
                    const text = ejs.render(tpl, { i18n: i18n[lang] });
                    await sendMessageWithLimit(bot, userId, text, {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }
                    });
                } catch (e) {
                    await handlerSendError(e, userId);
                }
            })
        );
    } else {
        const feedItems = toSend;
        await Promise.all(
            subscribers.map(async (subscribe) => {
                const userId = subscribe.user_id;
                let text = `<b>${sanitize(feed.feed_title)}</b>`;
                feedItems.forEach(function (item) {
                    text += `\n<a href="${item.link.trim()}">${
                        sanitize(item.title) || item.link.trim()
                    }</a>`;
                });
                try {
                    await sendMessageWithLimit(bot, userId, text, {
                        parse_mode: 'HTML',
                        link_preview_options: {
                            is_disabled: true
                        }
                    });
                } catch (e) {
                    const resend = await handlerSendError(e, userId);
                    if (resend && e.parameters?.migrate_to_chat_id) {
                        await sendMessageWithLimit(
                            bot,
                            e.parameters.migrate_to_chat_id,
                            text,
                            {
                                parse_mode: 'HTML',
                                link_preview_options: {
                                    is_disabled: true
                                }
                            }
                        );
                    }
                }
            })
        );
    }
};

function isChatUnAvailable(description: string): boolean {
    const re =
        /chat not found|bot was blocked by the user|bot was kicked|user is deactivated|have no rights|need administrator rights/;
    return re.test(description);
}

export default send;
