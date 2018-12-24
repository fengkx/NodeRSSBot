const path = require('path');

module.exports = {
    token: process.env.RSSBOT_TOKEN || '',
    socks_proxy: process.env.socks_proxy || undefined,
    db_path:
        process.env.RSSBOT_DB_PATH ||
        path.join(__dirname, '../data/database.db'),
    lang: process.env.RSSBOT_lang || 'zh-cn',
    item_num: process.env.RSSBOT_ITEM_NUM || 5,
    fetch_gap: process.env.RSSBOT_FETCH_GAP || '5m',
    notify_error_count: process.env.NOTIFY_ERR_COUNT || 5,
    view_all: !!process.env.RSSBOT_VIEW_ALL || false
};
