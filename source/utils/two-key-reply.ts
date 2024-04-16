import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { MContext, TNextFn } from '../types/ctx';

interface Middleware {
    (ctx: MContext, next?: TNextFn): any;
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
                link_preview_options: {
                    is_disabled: true
                },
                reply_markup: {
                    inline_keyboard: [[...kbs]]
                }
            }
        );
        await next();
    };
};
