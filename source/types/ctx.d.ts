import { Context } from 'telegraf';
import { Chat } from 'telegraf/types';
import { Outline } from './outline';
import { Feed } from './feed';

export interface MContext extends Context {
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
