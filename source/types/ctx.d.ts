import { ContextMessageUpdate } from 'telegraf';
import { Chat } from 'telegraf/typings/telegram-types';

export interface MContext extends ContextMessageUpdate {
    state?: {
        feedUrl?: string;
        lang?: string;
        chat?: Chat;
        processMesId?: number;
        rssPage?: number;
        showRaw?: boolean;
        viewallPage?: number;
        replyText?: string;
        feed?: any;
        fileLink?: string;
    };
}

export type Next = () => any;
