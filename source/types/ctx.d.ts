import { Context } from 'telegraf';
import { Chat } from 'telegraf/typings/telegram-types';
import { Outline } from './outline';
import { Feed } from './feed';
import { Update } from 'telegraf/typings/core/types/typegram';

export interface MContext<T = Update> extends Context<T> {
    state: {
        feedUrl?: string;
        feedUrls?: string[];
        lang?: string;
        chat?: Chat;
        processMsgId?: number;
        rssPage?: number;
        showRaw?: boolean;
        viewallPage?: number;
        replyText?: string;
        feed?: Partial<Feed>;
        fileLink?: string;
        outlines?: Outline[];
    };
}

export type TNextFn = () => void | Promise<void>;

export type AddMessageKey<K, T> = {
    message: {
        [P in K]: T;
    };
};
