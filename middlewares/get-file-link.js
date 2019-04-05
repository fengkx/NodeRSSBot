const logger = require('../utils/logger');

module.exports = async (ctx, next) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    if (fileName.startsWith('@')) {
        const channelId = fileName.match(/(@.+)\.opml$/)[1];
        try {
            ctx.state.chat = await ctx.telegram.getChat(channelId);
        } catch (e) {
            logger.error(e);
            if (e.message === '400: Bad Request: chat not found')
                throw new Error('CHANNEL_NOT_FOUND');
        }
        const me = await ctx.telegram.getMe();
        const admins = await ctx.telegram.getChatAdministrators(
            ctx.state.chat.id
        );
        const isAdmin = admins.some(function(item) {
            return item.user.id === me.id;
        });
        if (!isAdmin) throw new Error('CHANNEL_ADMIN_REQUIRE');
    }
    const fileLink = await ctx.telegram.getFileLink(fileId);
    if (fileLink) {
        ctx.state.fileLink = fileLink;
        await next();
    }
};
