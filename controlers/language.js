const USERS = require('./proxies/users');
const i18n = require('./i18n');

exports.replyKeyboard = async (ctx, next) => {
    const kbs = Object.keys(i18n).map((i) => {
        return {
            text: i,
            callback_data: `CHANGE_LANG_${i}_${ctx.state.chat.id}`
        };
    });
    await ctx.telegram.sendMessage(
        ctx.chat.id,
        i18n[ctx.state.lang]['CHOOSE_LANG'],
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

exports.changeLangCallback = async (ctx, next) => {
    const cb = ctx.callbackQuery;
    const data = cb.data.split('_');
    const lang = data[data.length - 2];
    const id = data[data.length - 1];
    await USERS.setLangById(id, lang);
    ctx.telegram.answerCbQuery(cb.id, i18n[lang]['SET_LANG_TO'] + ' ' + lang);
    await ctx.telegram.deleteMessage(cb.message.chat.id, cb.message.message_id);
    await next();
};
