import errors from '../utils/errors';
import { MContext, Next } from '../types/ctx';
export default async (ctx: MContext, next: Next): Promise<void> => {
    ctx.state.chat = await ctx.getChat();
    const chat = ctx.state.chat;
    if (chat.type !== 'private') {
        throw errors.newCtrlErr('PRIVATE_CHAT_ONLY');
    }
    await next();
};
