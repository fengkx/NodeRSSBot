const errors = require('../utils/errors');

module.exports = async (ctx, next) => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    if (chat.type !== 'private') {
        throw errors.newCtrlErr('PRIVATE_CHAT_ONLY');
    }
    await next();
};
