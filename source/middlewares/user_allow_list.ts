import { config } from '../config';
import i18n from '../i18n';
import { MContext, TNextFn } from '../types/ctx';
import { getUserById } from '../proxies/users';
import { isSome } from '../types/option';

export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    let id: number;
    switch (ctx.updateType) {
        case 'callback_query':
            id = ctx.callbackQuery.from.id;
            break;
        default:
            id = ctx.chat.id;
    }
    const user = await getUserById(id);
    if (isSome(user)) ctx.state.lang = user.value.lang;
    else ctx.state.lang = config.lang;
    const { lang } = ctx.state;
    if (config.allow_list && config.allow_list.length > 0) {
        // enabled allow list
        if (config.allow_list.includes(id)) {
            await next();
        } else {
            ctx.reply(i18n[lang]['ALLOW_LIST_NOT_INCLUDE']);
        }
    } else {
        await next();
    }
};
