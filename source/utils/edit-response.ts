import { TelegramError } from 'telegraf';
import type { Convenience } from 'telegraf/types';
import { MContext } from '../types/ctx';
import errors from './errors';

export function badRequestDescription(error: unknown): string {
    return error instanceof TelegramError && error.code === 400
        ? error.description
              .toLowerCase()
              .replace(/^bad request: /, '')
              .replaceAll('_', ' ')
              // Telegram uses both "MESSAGE_TOO_LONG" and "message is too long"
              .replace('is too long', 'too long')
        : '';
}

export function cannotEdit(description: string): boolean {
    return (
        description === 'message to edit not found' ||
        description === "message can't be edited"
    );
}

export default async function editResponse(
    ctx: MContext,
    text: string,
    extra?: Convenience.ExtraEditMessageText
): Promise<void> {
    try {
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            ctx.state.processMsgId,
            undefined,
            text,
            extra
        );
    } catch (error) {
        const description = badRequestDescription(error);
        if (description.startsWith('message is not modified')) return;
        if (description === 'message too long') {
            throw errors.newCtrlErr('RESPONSE_TOO_LONG');
        }
        if (!cannotEdit(description)) throw error;
        const message = await ctx.reply(text, extra);
        ctx.state.processMsgId = message.message_id;
    }
}
