import { Feed, FeedItem } from './feed';

export interface SuccessMessage extends Message {
    success: true;
    sendItems: FeedItem[];
}

export function isSuccess(m: Message): m is SuccessMessage {
    return m.success;
}

export interface ErrorMaxTimeMessage extends Message {
    success: false;
    message: 'MAX_TIME';
}

export function isErrorMaxTime(m: Message): m is ErrorMaxTimeMessage {
    return m.message === 'MAX_TIME';
}

export interface ChangeFeedUrlMessage extends Message {
    success: false;
    message: 'CHANGE';
    new_feed: string[];
}

export function isChangeFeedUrl(m: Message): m is ChangeFeedUrlMessage {
    return m.message === 'CHANGE';
}

export interface Message extends Messager {
    success: boolean;
    err: Messager;
    feed: Feed;
}

export interface Messager {
    message: string;
}
