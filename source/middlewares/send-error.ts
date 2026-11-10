import { CB_QUERY_TEXT_LIMIT, limitText } from '../utils/limit-text';
import i18n from '../i18n';
import logger from '../utils/logger';
import errors from '../utils/errors';
import editResponse from '../utils/edit-response';
import { MContext, TNextFn } from '../types/ctx';

export async function handleErrors(
    ctx: MContext,
    next: TNextFn
): Promise<void> {
    try {
        await next();
    } catch (e) {
        if (!(e instanceof errors.ControllableError)) throw e;
        const text = e.toString(ctx.state.lang);
        if (ctx.callbackQuery)
            await ctx.answerCbQuery(limitText(text, CB_QUERY_TEXT_LIMIT));
        else if (ctx.state.processMsgId) await editResponse(ctx, text);
        else await ctx.reply(text);
    }
}

interface ProcessingOptions {
    /** Attach remove_keyboard to the processing reply, clearing a picker keyboard. */
    removeKeyboard?: boolean;
}

export async function processing(
    ctx: MContext,
    next: TNextFn,
    { removeKeyboard = false }: ProcessingOptions = {}
): Promise<void> {
    const callbackMessage = ctx.callbackQuery?.message;
    if (callbackMessage) {
        ctx.state.processMsgId = callbackMessage.message_id;
    } else {
        const reply = await ctx.reply(
            i18n[ctx.state.lang]['PROCESSING'],
            removeKeyboard
                ? { reply_markup: { remove_keyboard: true } }
                : undefined
        );
        ctx.state.processMsgId = reply.message_id;
    }
    logger.debug(ctx.message);
    await next();
    if (ctx.callbackQuery) await ctx.answerCbQuery();
}

export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    await handleErrors(ctx, () => processing(ctx, next));
};
