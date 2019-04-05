module.exports = (text, kbs) => {
    // text is optional default to ctx.state.replyText
    if (!kbs) {
        kbs = text;
        text = null;
    }
    return async (ctx, next) => {
        if (ctx.state.processMesId) {
            await ctx.telegram.deleteMessage(
                ctx.chat.id,
                ctx.state.processMesId
            );
            ctx.state.processMesId = null;
        }
        await ctx.telegram.sendMessage(
            ctx.chat.id,
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
