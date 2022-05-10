export type Config = {
    token: string;
    proxy: {
        protocol: string;
        host: string;
        port: string;
    };
    db_path: string;
    lang: string;
    item_num: number;
    fetch_gap: string;
    strict_ttl: boolean;
    http_cache: boolean;
    notify_error_count: number;
    view_all: boolean;
    UA: string;
    not_send: boolean;
    concurrency: number;
    delete_on_err_send: boolean;
    resp_timeout: number;
    allow_list: number[] | null;
    auto_migrate: boolean;
    sentry_dsn?: string;
    enable_throttle: boolean;
    ['PKG_ROOT']: Readonly<string>;
};
