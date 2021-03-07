import * as path from 'path';
import { Config } from './types/config';
import { version } from '../package.json';

const PKGROOT = path.join(
    __dirname,
    __dirname.includes('dist') ? '../..' : '..'
);
export const config: Config = {
    token: process.env.RSSBOT_TOKEN || '',
    proxy: {
        protocol: process.env.PROXY_PROTOCOL || null,
        host: process.env.PROXY_HOST || null,
        port: process.env.PROXY_PORT || null
    },
    db_path:
        (process.env.DYNO // heroku
            ? process.env.DATABASE_URL
            : process.env.RSSBOT_DB_PATH) ||
        path.join(PKGROOT, 'data', 'database.db'), // /dist/source/config.js -> /data/
    lang: process.env.RSSBOT_LANG || 'zh-cn',
    item_num: parseInt(process.env.RSSBOT_ITEM_NUM) || 10,
    fetch_gap: process.env.RSSBOT_FETCH_GAP || '5m',
    strict_ttl: !!process.env.RSSBOT_STRICT_TTL || true,
    notify_error_count: parseInt(process.env.NOTIFY_ERR_COUNT) || 5,
    view_all: !!process.env.RSSBOT_VIEW_ALL || false,
    UA:
        process.env.RSSBOT_UA ||
        `Mozilla/5.0  NodeRSSBot v${version}(https://github.com/fengkx/NodeRSSBot)`,
    not_send: !!process.env.NOT_SEND || false, // just for debug use
    concurrency: parseInt(process.env.RSSBOT_CONCURRENCY) || 200,
    delete_on_err_send: !!process.env.DELETE_ON_ERR_SEND || true, // block and chat not found
    resp_timeout: parseInt(process.env.RSSBOT_RESP_TIMEOUT) || 40,
    allow_list: process.env.RSSBOT_ALLOW_LIST
        ? process.env.RSSBOT_ALLOW_LIST.split(',').map((id) => Number(id))
        : null,
    auto_migrate: !!process.env.AUTO_MIGRATE || true
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
