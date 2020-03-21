import i18n from '../i18n';
import logger from '../utils/logger';
import errors from "../utils/errors";
import {getUserById} from '../proxies/users';
import {MContext, Next} from "../types/ctx";
import {config} from "../config";

export default async (ctx: MContext, next: Next) => {
    let id: number;
    switch (ctx.updateType) {
        case 'message':
            id = ctx.message.chat.id;
            break;
        case 'callback_query':
            id = ctx.callbackQuery.from.id;
            break;
    }
    const user = await getUserById(id);
    if (user) ctx.state.lang = user.lang;
    else ctx.state.lang = config.lang;
    const lang = ctx.state.lang;
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
