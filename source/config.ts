import * as path from 'path';
import { Config } from './types/config';
import { version } from '../package.json';

export const config: Config = {
    token: process.env.RSSBOT_TOKEN || '',
    proxy: {
        protocol: process.env.PROXY_PROTOCOL || null,
        host: process.env.PROXY_HOST || null,
        port: process.env.PROXY_PORT || null
    },
    db_path:
        process.env.RSSBOT_DB_PATH ||
        path.join(__dirname, '../../data/database.db'), // /dist/source/config.js -> /data/
    lang: process.env.RSSBOT_LANG || 'zh-cn',
    item_num: parseInt(process.env.RSSBOT_ITEM_NUM) || 10,
    fetch_gap: process.env.RSSBOT_FETCH_GAP || '5m',
    notify_error_count: parseInt(process.env.NOTIFY_ERR_COUNT) || 5,
    view_all: !!process.env.RSSBOT_VIEW_ALL || false,
    UA:
        process.env.RSSBOT_UA ||
        `Mozilla/5.0  NodeRSSBot v${version}(https://github.com/fengkx/NodeRSSBot)`,
    not_send: !!process.env.NOT_SEND || false, // just for debug use
    concurrency: parseInt(process.env.RSSBOT_CONCURRENCY) || 200,
    delete_on_err_send: !!process.env.DELETE_ON_ERR_SEND || true, // block and chat not found
    resp_timeout: parseInt(process.env.RSSBOT_RESP_TIMEOUT) || 40
};
