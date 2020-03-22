import { Feed } from './feed';

export interface Message extends Messager {
    success: boolean;
    sendItems?: Feed[];
    feed?: Feed;
    new_feed?: string[]; // new feed urls found on page
    err: Messager;
    eachFeed?: Feed;
}

export interface Messager {
    message: string;
}
