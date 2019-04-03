module.exports = async (ctx, next) => {
    if (
        ctx.message.reply_to_message &&
        ctx.message.reply_to_message.text.startsWith('/import')
    ) {
        const channelId = ctx.message.reply_to_message.text.match(/@\w+/)[0];
        ctx.state.chat = await ctx.telegram.getChat(channelId);
    } else {
        ctx.state.chat = ctx.chat;
    }
    const fileId = ctx.message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    if (fileLink) {
        ctx.state.fileLink = fileLink;
        await next();
    }
};
