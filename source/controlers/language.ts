import { setLangById } from '../proxies/users';
import i18n from '../i18n';
import { MContext, TNextFn } from '../types/ctx';

const chunk = (input: any[], size: number) => {
    return input.reduce((arr, item, idx): any[][] => {
        return idx % size === 0
            ? [...arr, [item]]
            : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }, []);
};

export async function replyKeyboard(
    ctx: MContext,
    next: TNextFn
): Promise<void> {
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
            link_preview_options: {
                is_disabled: true
            },
            reply_markup: {
                inline_keyboard: chunk(kbs, 5)
            }
        }
    );
    await next();
}

export async function changeLangCallback(
    ctx: MContext,
    next: TNextFn
): Promise<void> {
    const cb = ctx.callbackQuery;
    if ('data' in cb) {
        const data = cb.data.split('_');
        const lang = data[data.length - 2];
        const id = data[data.length - 1];
        await setLangById(parseInt(id), lang);
        ctx.telegram.answerCbQuery(
            cb.id,
            i18n[lang]['SET_LANG_TO'] + ' ' + lang
        );
        await ctx.telegram.deleteMessage(
            cb.message.chat.id,
            cb.message.message_id
        );
        await next();
    }
}
