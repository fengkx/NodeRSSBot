const i18n = require('../i18n');
const logger = require('../utils/logger');
const errors = require('../utils/errors');
const USERS = require('../proxies/users');
module.exports = async (ctx, next) => {
    const user = await USERS.getUserById(ctx.message.chat.id);
    if (user) ctx.state.lang = user.lang;
    const lang = ctx.state.lang || require('../config').lang;
    const m = await ctx.reply(i18n[lang]['PROCESSING']);
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
            ctx.reply(e.toString(lang));
        } else throw e;
    }
};
