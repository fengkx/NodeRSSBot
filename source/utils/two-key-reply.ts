import { InlineKeyboardButton } from 'telegraf/typings/telegram-types';
import { MContext, Next } from '../types/ctx';

interface Middleware {
    (ctx: MContext, next?: Next): any;
}
export default (kbs: InlineKeyboardButton[], text?: string): Middleware => {
    // text is optional default to ctx.state.replyText
    return async (ctx, next) => {
        if (ctx.state.processMsgId) {
            await ctx.telegram.deleteMessage(
                ctx.chat.id,
                ctx.state.processMsgId
            );
            ctx.state.processMsgId = null;
        }
        await ctx.telegram.sendMessage(
            ctx.chat.id,
            text || ctx.state.replyText,
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
};
