import * as path from 'path';
import { Config } from './types/config';
import { version } from '../package.json';
import env from 'env-var';

const PKGROOT = path.join(
    __dirname,
    __dirname.includes('dist') ? '../..' : '..'
);
export const config: Omit<Config, 'PKG_ROOT'> = {
    token: env.get('RSSBOT_TOKEN').required().asString(),
    proxy: {
        protocol: env.get('PROXY_PROTOCOL').asString(),
        host: env.get('PROXY_HOST').asString(),
        port: env.get('PROXY_PORT').asString()
    },
    db_path:
        (process.env.DYNO // heroku
            ? process.env.DATABASE_URL
            : process.env.RSSBOT_DB_PATH) ||
        path.join(PKGROOT, 'data', 'database.db'), // /dist/source/config.js -> /data/
    lang: env.get('RSSBOT_LANG').default('zh-cn').asString(),
    item_num: env.get('RSSBOT_ITEM_NUM').default(10).asIntPositive(),
    fetch_gap: env.get('RSSBOT_FETCH_GAP').default('5m').asString(),
    strict_ttl: env.get('RSSBOT_STRICT_TTL').default(1).asBool(),
    http_cache: env.get('RSSBOT_HTTP_CACHE').default(0).asBool(),
    notify_error_count: env.get('NOTIFY_ERR_COUNT').default(5).asIntPositive(),
    view_all: env.get('RSSBOT_VIEW_ALL').default(0).asBool(),
    UA: env
        .get('RSSBOT_UA')
        .default(
            `Mozilla/5.0  NodeRSSBot v${version}(https://github.com/fengkx/NodeRSSBot)`
        )
        .asString(),
    not_send: env.get('NOT_SEND').default(0).asBool(), // just for debug use
    concurrency: env.get('RSSBOT_CONCURRENCY').default(200).asIntPositive(),
    delete_on_err_send: env.get('DELETE_ON_ERR_SEND').default(1).asBool(), // block and chat not found
    resp_timeout: env.get('RSSBOT_RESP_TIMEOUT').default(40).asIntPositive(),
    allow_list: env
        .get('RSSBOT_ALLOW_LIST')
        .default('')
        .asArray(',')
        .map((id) => Number(id)),
    auto_migrate: env.get('AUTO_MIGRATE').default(1).asBool(),
    sentry_dsn: env.get('SENTRY_DSN').default('').asString(),
    enable_throttle: env.get('ENABLE_THROTTLE').default(0).asBool()
};
Object.defineProperty(config, 'PKG_ROOT', {
    enumerable: false,
    writable: false,
    value: PKGROOT
});

let GAP_MINUTES: number;
const { fetch_gap } = config;
const gapNum = parseInt(fetch_gap.substring(0, fetch_gap.length - 1));
const unit = fetch_gap[fetch_gap.length - 1];
switch (unit) {
    case 'h':
        GAP_MINUTES = gapNum * 60;
        break;
    case 'm':
    default:
        GAP_MINUTES = gapNum;
}
Object.defineProperty(config, 'GAP_MINUTES', {
    enumerable: false,
    writable: false,
    value: GAP_MINUTES
});
