module.exports = async (ctx, next) => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    if (chat.type !== 'private') {
        throw new Error('PRIVATE_CHAT_ONLY');
    }
    await next();
};

