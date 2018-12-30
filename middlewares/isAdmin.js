const logger = require('../utils/logger');

module.exports = async (ctx, next) => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    if (chat.type !== 'private') {
        switch (chat.type) {
            case 'group':
            case 'supergroup':
            case 'channel':
                const admins = await ctx.getChatAdministrators(chat.id);
                const isAdmin = admins.some(function(item) {
                    return item.user.id === ctx.message.from.id;
                });
                if (!isAdmin) throw new Error('ADMIN_ONLY');
        }
    } else if (
        ctx.message.text &&
        ctx.message.text.search(/@[\w|\d|_]+/) !== -1
    ) {
        // for channel subscription in private chat
        const channelId = ctx.message.text.match(/@[\w|\d|_]+/)[0];
        if (!!channelId) {
            ctx.message.text = ctx.message.text.replace(channelId, ' ');
            try {
                ctx.state.chat = await ctx.telegram.getChat(channelId);
            } catch (e) {
                logger.error(e);
                if (e.message === '400: Bad Request: chat not found')
                    throw new Error('CHANNEL_NOT_FOUND');
            }
            const admins = await ctx.getChatAdministrators(ctx.state.chat.id);
            const me = await ctx.telegram.getMe();
            const isAdmin = admins.some(function(item) {
                return item.user.id === me.id;
            });
            if (!isAdmin) throw new Error('CHANNEL_ADMIN_REQUIRE');
        }
    }
    await next();
};
