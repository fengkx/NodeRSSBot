import i18n from '../i18n.js';
import logger from '../utils/logger.js';
import errors from '../utils/errors.js';
import { MContext, Next } from '../types/ctx';

export default async (ctx: MContext, next: Next): Promise<void> => {
    const { lang } = ctx.state;
    const m = await ctx.reply(i18n[lang]['PROCESSING'], {
        reply_markup: {
            remove_keyboard: true
        }
    });
    ctx.state.processMsgId = m.message_id;
    logger.debug(ctx.message);
    try {
        await next();
    } catch (e) {
        if (e instanceof errors.ControllableError) {
            if (ctx.state.processMsgId) {
                ctx.telegram.deleteMessage(
                    ctx.state.chat.id,
                    ctx.state.processMsgId
                );
            }
            ctx.reply(e.toString(lang));
        } else throw e;
    }
};
