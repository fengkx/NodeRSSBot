const i18n = require('../i18n');

module.exports = async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
    await ctx.telegram.sendMessage(ctx.state.chat.id, i18n['CONFIRM'], {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: i18n['YES'],
                        callback_data: 'UNSUB_ALL_YES'
                    },
                    {
                        text: i18n['NO'],
                        callback_data: 'UNSUB_ALL_NO'
                    }
                ]
            ]
        }
    });
    await next();
};
