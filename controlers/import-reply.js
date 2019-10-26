const USERS = require('../proxies/users');
const i18n = require('../i18n');

module.exports = async (ctx, next) => {
    const user = await USERS.getUserById(ctx.message.chat.id);
    if (user) ctx.state.lang = user.lang;
    const lang = ctx.state.lang || require('../config').lang;
    ctx.reply(i18n[lang]['IMPORT_USAGE']);
    await next();
};
