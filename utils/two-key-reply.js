module.exports = (text, kbs) => {
    // text is optional default to ctx.state.replyText
    if (!kbs) {
        kbs = text;
        text = null;
    }
    return async (ctx, next) => {
        await ctx.telegram.deleteMessage(
            ctx.state.chat.id,
            ctx.state.processMesId
        );
        ctx.state.processMesId = null;
        await ctx.telegram.sendMessage(
            ctx.state.chat.id,
            text || ctx.state.replyText,
            {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [[...kbs]]
                }
            }
        );
        await next();
    };
};
