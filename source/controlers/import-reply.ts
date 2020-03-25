import { getUserById } from '../proxies/users';
import i18n from '../i18n';
import { MContext, Next } from '../types/ctx';
import { config } from '../config';
import { isSome } from '../types/option';

export default async (ctx: MContext, next?: Next) => {
    const user = await getUserById(ctx.message.chat.id);
    if (isSome(user)) ctx.state.lang = user.value.lang;
    const lang = ctx.state.lang || config.lang;
    ctx.reply(i18n[lang]['IMPORT_USAGE']);
    await next();
};
