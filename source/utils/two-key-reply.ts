import editResponse from './edit-response';
import { InlineKeyboardButton } from 'telegraf/types';
import { MContext, TNextFn } from '../types/ctx';

interface Middleware {
    (ctx: MContext, next?: TNextFn): any;
}
export default (kbs: InlineKeyboardButton[], text?: string): Middleware => {
    // text is optional default to ctx.state.replyText
    return async (ctx, next) => {
        await editResponse(ctx, text || ctx.state.replyText, {
            parse_mode: 'HTML',
            link_preview_options: {
                is_disabled: true
            },
            reply_markup: {
                inline_keyboard: kbs.length ? [kbs] : []
            }
        });
        await next();
    };
};
