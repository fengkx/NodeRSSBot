import i18n from '../i18n';
import logger from '../utils/logger';
import errors from '../utils/errors';
import { MContext, TNextFn } from '../types/ctx';

export default async (ctx: MContext, next: TNextFn): Promise<void> => {
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
