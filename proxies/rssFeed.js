const px = {};
const dbPomise = require('../database');
const errors = require('../utils/errors');

px.sub = async (userId, feedUrl, feedTitle) => {
    feedUrl = decodeURI(feedUrl);
    const db = await dbPomise;
    const feed = await db.get(
        `SELECT *
             FROM rss_feed
             WHERE url = ?`,
        [feedUrl]
    );
    if (feed) {
        const sql = `SELECT *
                     FROM subscribes
                     WHERE user_id = ?
                       AND feed_id = ?`;
        const res = await db.all(sql, [userId, feed.feed_id]);
        if (res.length === 0) {
            await db.run(
                'INSERT INTO subscribes(feed_id, user_id) VALUES (?, ?)',
                [feed.feed_id, userId]
            );
            return 'ok';
        } else {
            throw errors.newCtrlErr('ALREADY_SUB');
        }
    } else {
        await db.run(
            `INSERT INTO rss_feed(url, feed_title)
                 VALUES (?, ?);`,
            feedUrl,
            feedTitle
        );
        const feed = await db.get(
            `SELECT feed_id
                 FROM rss_feed
                 WHERE url = ?`,
            feedUrl
        );
        await db.run('INSERT INTO subscribes(feed_id, user_id) VALUES (?, ?)', [
            feed.feed_id,
            userId
        ]);
        return 'ok';
    }
};

px.getFeedByUrl = async (feedUrl) => {
    try {
        const db = await dbPomise;
        return await db.get(
            `SELECT *
                 FROM rss_feed
                 WHERE url = ?`,
            [feedUrl]
        );
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.unsub = async (userId, feedId) => {
    try {
        const db = await dbPomise;
        await db.run('DELETE FROM subscribes WHERE feed_id=? AND user_id=?', [
            feedId,
            userId
        ]);
        return 'ok';
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.getAllFeeds = async () => {
    try {
        const db = await dbPomise;
        return await db.all(`SELECT rf.*
                             FROM subscribes
                                    LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                             GROUP BY rf.feed_id`);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.updateHashList = async (feedId, hashList) => {
    try {
        const db = await dbPomise;
        await db.run(
            `UPDATE rss_feed
                 SET recent_hash_list=?
                 where feed_id = ?`,
            JSON.stringify(hashList),
            feedId
        );
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.getFeedsByTitle = async (title) => {
    try {
        const db = await dbPomise;
        return await db.all(
            `SELECT *
                 FROM rss_feed
                 WHERE feed_title = ?`,
            title
        );
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.getSubscribedFeedsByUserId = async (userId, limit = 1000, page = 1) => {
    if (page < 1) {
        page = 1;
    }
    try {
        const db = await dbPomise;
        const sql = `
          SELECT rf.feed_id, rf.feed_title, rf.url
          FROM subscribes
                 LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
          WHERE subscribes.user_id = ? LIMIT ? OFFSET ?
        `;
        return await db.all(sql, userId, limit, (page - 1) * limit);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.getSubscribedCountByUserId = async (userId) => {
    try {
        const db = await dbPomise;
        const sql = `SELECT COUNT(rf.feed_id) count
                     FROM subscribes
                              LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                     WHERE subscribes.user_id = ?
        `;
        const result = await db.all(sql, userId);
        return result[0].count;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.resetErrorCount = async (feedUrl) => {
    try {
        const db = await dbPomise;
        await db.run(
            `UPDATE rss_feed
                 SET error_count=0
                 WHERE url = ?`,
            feedUrl
        );
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.failAttempt = async (feedUrl) => {
    try {
        const db = await dbPomise;
        const sql = `UPDATE rss_feed
                     SET error_count=error_count + 1
                     WHERE url = ? `;
        await db.run(sql, feedUrl);
        return 'ok';
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.unsubAll = async (userId) => {
    try {
        const db = await dbPomise;
        await db.run(
            `DELETE
                 FROM subscribes
                 WHERE user_id = ?`,
            userId
        );
        return 'ok';
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.getAllFeedsWithCount = async (limit, page) => {
    if (page < 1) page = 1;
    try {
        const db = await dbPomise;
        return await db.all(
            `SELECT subscribes.feed_id, COUNT(rf.feed_id) AS sub_count, rf.feed_title, rf.url
                FROM subscribes
                         LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                GROUP BY subscribes.feed_id
                ORDER BY sub_count DESC LIMIT ? OFFSET ?`,
            limit,
            limit * (page - 1)
        );
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.getAllFeedsCount = async () => {
    try {
        const db = await dbPomise;
        const result = await db.all(`
        SELECT COUNT(DISTINCT rf.feed_id) as count
            FROM subscribes
            LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id`);
        return result[0].count;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.handleRedirect = async (url, realUrl) => {
    try {
        const db = await dbPomise;
        const oldFeed = await db.get(`SELECT * FROM rss_feed WHERE url=?`, url);
        const realFeed = await db.get(
            `SELECT * FROM rss_feed WHERE url=?`,
            realUrl
        );
        if (realFeed) {
            await db.run(
                `UPDATE subscribes SET feed_id=? WHERE feed_id=?`,
                realFeed.feed_id,
                oldFeed.feed_id
            );
            await db.run(`DELETE FROM rss_feed WHERE url=?`, oldFeed.url);
        } else {
            await db.run(
                `UPDATE rss_feed SET url=? WHERE url=?`,
                realUrl,
                oldFeed.url
            );
        }
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};

px.updateFeedUrl = async (oldUrl, newUrl) => {
    try {
        const db = await dbPomise;
        const sql = `UPDATE rss_feed
                 SET url=?
                 WHERE url = ?`;
        await db.run(sql, newUrl, oldUrl);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
};
module.exports = px;
