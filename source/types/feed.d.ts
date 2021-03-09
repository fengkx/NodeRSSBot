export interface Feed {
    feed_id: number;
    url: string;
    feed_title: string;
    recent_hash_list: string;
    error_count: number;
    next_fetch_time?: number | string | Date;
    sub_count?: number;
    etag_header: string;
    last_modified_header: string;
    ttl: number;
}

export interface FeedItem {
    link: string;
    title: string;
    content: string;
    guid?: string;
    id?: string;
}
