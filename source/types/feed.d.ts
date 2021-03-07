export interface Feed {
    feed_id: number;
    url: string;
    feed_title: string;
    recent_hash_list: string;
    error_count: number;
    next_fetch_time?: number | string | Date;
    sub_count?: number;
}

export interface FeedItem {
    link: string;
    title: string;
    content: string;
    guid?: string;
    id?: string;
}
