const i18n = require('../i18n');
const logger = require('../utils/logger');
const errors = require('../utils/errors');
module.exports = async (ctx, next) => {
    const m = await ctx.reply(i18n['PROCESSING']);
    ctx.state.processMesId = m.message_id;
    logger.debug(ctx.message);
    try {
        await next();
    } catch (e) {
        if (e instanceof errors.ControllableError) {
            if (ctx.state.processMesId) {
                ctx.telegram.deleteMessage(
                    ctx.state.chat.id,
                    ctx.state.processMesId
                );
            }
            ctx.reply(e.toString());
        } else throw e;
    }
};
