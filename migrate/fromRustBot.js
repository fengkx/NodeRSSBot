const logger = require('../utils/logger');
const fs = require('fs');
const dbPromise = require('../database');
const dbPathFromRust = `${__dirname}/db`;
if (!fs.existsSync(dbPathFromRust)) {
    logger.error(`data file from rust RSSBot not found${dbPathFromRust}`);
    process.exit(1);
}

const dbStr = fs.readFileSync(dbPathFromRust, 'utf8');

(async () => {
    await require('../database/initTables')();
    const dataSrc = JSON.parse(dbStr);
    const db = await dbPromise;
    await Promise.all(
        dataSrc.map(async item => {
            const { link, title, subscribers } = item;
            logger.info(`processing ${title} ${link}`);
            const res = await db.run(
                `INSERT INTO rss_feed (url, feed_title)
                                  VALUES (?, ?)`,
                link,
                title
            );
            const feedId = res.lastID;
            await Promise.all(
                subscribers.map(async id => {
                    await db.run(
                        `INSERT INTO subscribes (feed_id, user_id)
                          VALUES (?, ?)`,
                        feedId,
                        id
                    );
                })
            );
        })
    );
    logger.info('finish');
})();
