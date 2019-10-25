const errors = require('../utils/errors');
const USERS = require('../proxies/users');
const config = require('../config');

module.exports = async (ctx, next) => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    let user = await USERS.getUserById(chat.id);
    if (!user) {
        user = await USERS.newUser(chat.id, config.lang);
    }
    ctx.state.lang = user.lang;

    if (chat.type !== 'private') {
        const admins = await ctx.getChatAdministrators(chat.id);
        let from = null;
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
                const isAdmin = admins.some(function(item) {
                    return item.user.id === from.id;
                });
                if (!isAdmin) throw errors.newCtrlErr('ADMIN_ONLY');
        }
    } else if (
        ctx.message && // button respone without message
        ctx.message.text &&
        ctx.message.text.search(/(@\w+)|(-\d+)/) !== -1
    ) {
        // for channel subscription in private chat
        const channelId = ctx.message.text.match(/(@\w+)|(-\d+)/)[0];
        if (channelId) {
            ctx.message.text = ctx.message.text.replace(channelId, ' ');
            try {
                ctx.state.chat = await ctx.telegram.getChat(channelId);
                // set lang
                let user = await USERS.getUserById(chat.id);
                if (!user) {
                    user = await USERS.newUser(chat.id, config.lang);
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
            const isAdmin = admins.some(function(item) {
                return item.user.id === me.id;
            });
            if (!isAdmin) throw errors.newCtrlErr('CHANNEL_ADMIN_REQUIRE');
        }
    }
    await next();
};
