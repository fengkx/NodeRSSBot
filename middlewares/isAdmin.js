const logger = require('../utils/logger');

module.exports = async (ctx, next) => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    if (chat.type !== 'private') {
    const admins = await ctx.getChatAdministrators(chat.id);
        switch (chat.type) {
            case 'group':
            case 'supergroup':
            case 'channel':
                // eslint-disable-next-line no-case-declarations
                const isAdmin = admins.some(function(item) {
                    return item.user.id === ctx.message.from.id;
                });
                if (!isAdmin) throw new Error('ADMIN_ONLY');
        }
    } else if (
        ctx.message && // button respone without message
        ctx.message.text &&
        ctx.message.text.search(/@\w+/) !== -1
    ) {
        // for channel subscription in private chat
        const channelId = ctx.message.text.match(/@\w+/)[0];
        if (channelId) {
            ctx.message.text = ctx.message.text.replace(channelId, ' ');
            try {
                ctx.state.chat = await ctx.telegram.getChat(channelId);
            } catch (e) {
                logger.error(e);
                if (e.message === '400: Bad Request: chat not found')
                    throw new Error('CHANNEL_NOT_FOUND');
            }
            const me = await ctx.telegram.getMe();
            const isAdmin = admins.some(function(item) {
                return item.user.id === me.id;
            });
            if (!isAdmin) throw new Error('CHANNEL_ADMIN_REQUIRE');
        }
    }
    await next();
};
