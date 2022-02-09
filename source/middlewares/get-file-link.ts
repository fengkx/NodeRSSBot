import errors from '../utils/errors';
import { AddMessageKey, MContext, TNextFn } from '../types/ctx';
import { Message } from 'telegraf/typings/core/types/typegram';

export default async (
    ctx: MContext &
        AddMessageKey<'document', Message.DocumentMessage['document']>,
    next: TNextFn
): Promise<void> => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    if (fileName.search(/(^@\w+)|(^-\d+)/) !== -1) {
        const channelId = fileName.match(/(@\w+)|(-\d+)/)[0];
        try {
            ctx.state.chat = await ctx.telegram.getChat(channelId);
        } catch (e) {
            if (e.message === '400: Bad Request: chat not found')
                throw errors.newCtrlErr('CHANNEL_NOT_FOUND', e);
        }
        const me = await ctx.telegram.getMe();
        const admins = await ctx.telegram.getChatAdministrators(
            ctx.state.chat.id
        );
        const isAdmin = admins.some(function (item) {
            return item.user.id === me.id;
        });
        if (!isAdmin) throw errors.newCtrlErr('CHANNEL_ADMIN_REQUIRE');
    }
    const fileLink = await ctx.telegram.getFileLink(fileId);
    if (fileLink) {
        ctx.state.fileLink = fileLink.toString();
        await next();
    }
};
