const i18n = require('../i18n');
const logger = require('../utils/logger');
module.exports = async (ctx, next) => {
    const m = await ctx.reply(i18n['PROCESSING'])
    ctx.state.processMesId = m.message_id;
    logger.debug(ctx.message);
    try {
        await next();
    } catch (e) {
        if (e instanceof Error) {
            ctx.reply(i18n[e.message]);
            logger.error(e.stack);
        } else
            throw e;
    }
};
