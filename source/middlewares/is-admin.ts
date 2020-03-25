import { config } from '../config';
import errors from '../utils/errors';
import { getUserById, newUser } from '../proxies/users';
import { MContext, Next } from '../types/ctx';
import { User } from 'telegraf/typings/telegram-types';
import { isNone, Option } from '../types/option';
import { User as DBUser } from '../types/user';

/**
 * Check if using for channel
 * @param {string} text message recived
 * @return {boolean} whether contain channel id (can be start with @ or a number start with -)
 */
function checkChannelId(text: string): boolean {
    const textPart = text.split(/\s+/);
    if (textPart.length > 1 && textPart[1].match(/^(@\w+)|(-\d+)$/)) {
        return true;
    }
    return false;
}

export default async (ctx: MContext, next: Next) => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    let user: Option<DBUser> | DBUser = await getUserById(chat.id);
    if (isNone(user)) {
        user = await newUser(chat.id, config.lang);
    } else {
        user = user.value;
    }
    ctx.state.lang = user.lang;

    if (chat.type !== 'private') {
        const admins = await ctx.telegram.getChatAdministrators(chat.id);
        let from: User = undefined;
        if (ctx.message) {
            from = ctx.message.from || ctx.callbackQuery.from;
        } else {
            from = ctx.callbackQuery.from;
        }
        switch (chat.type) {
            case 'group':
            case 'supergroup':
            case 'channel':
                // eslint-disable-next-line no-case-declarations
                const isAdmin = admins.some(function (item) {
                    return item.user.id === from.id;
                });
                if (!isAdmin) throw errors.newCtrlErr('ADMIN_ONLY');
        }
    } else if (ctx.message?.text && checkChannelId(ctx.message?.text)) {
        // for channel subscription in private chat
        const channelId = ctx.message.text.match(/(@\w+)|(-\d+)/)[0];
        if (channelId) {
            ctx.message.text = ctx.message.text.replace(channelId, ' ');
            try {
                ctx.state.chat = await ctx.telegram.getChat(channelId);
                // set lang
                let user: Option<DBUser> | DBUser = await getUserById(chat.id);
                if (isNone(user)) {
                    user = await newUser(chat.id, config.lang);
                } else {
                    user = user.value;
                }
                ctx.state.lang = user.lang;
            } catch (e) {
                if (e.message === '400: Bad Request: chat not found')
                    throw errors.newCtrlErr('CHANNEL_NOT_FOUND', e);
            }
            const me = await ctx.telegram.getMe();
            const admins = await ctx.telegram.getChatAdministrators(
                ctx.state.chat.id
            );
            const isAdmin = admins.some(function (item) {
                return item.user.id === me.id;
            });
            if (!isAdmin) throw errors.newCtrlErr('CHANNEL_ADMIN_REQUIRE');
        }
    }
    await next();
};
