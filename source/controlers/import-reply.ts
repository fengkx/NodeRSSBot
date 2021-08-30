import { getUserById } from '../proxies/users.js';
import i18n from '../i18n.js';
import { MContext, Next } from '../types/ctx';
import { config } from '../config.js';
import { isSome } from '../types/option.js';

export default async (ctx: MContext, next?: Next): Promise<void> => {
    const user = await getUserById(ctx.message.chat.id);
    if (isSome(user)) ctx.state.lang = user.value.lang;
    const lang = ctx.state.lang || config.lang;
    ctx.reply(i18n[lang]['IMPORT_USAGE']);
    await next();
};
