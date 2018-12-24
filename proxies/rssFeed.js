const px = {};
const dbPomise = require('../database');

px.sub = async (userId, feedUrl, feedTitle) => {
    feedUrl = encodeURI(feedUrl);
    const db = await dbPomise;
    const feed = await db.get(
        `SELECT *
         FROM rss_feed
         WHERE url = ?`,
        [feedUrl]
    );
    if (!!feed) {
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
            throw new Error('ALREADY_SUB');
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
        throw new Error('DB_ERROR');
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
        throw new Error('DB_ERROR');
    }
};

px.getAllFeeds = async () => {
    try {
        const db = await dbPomise;
        return await db.all(`SELECT rf.*
                             FROM subscribes
                                    LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id`);
    } catch (e) {
        throw new Error('DB_ERROR');
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
        throw new Error('DB_ERROR');
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
        throw new Error('DB_ERROR');
    }
};

px.getSubscribedFeedsByUserId = async (userId) => {
    try {
        const db = await dbPomise;
        const sql = `
          SELECT rf.feed_id, rf.feed_title, rf.url
          FROM subscribes
                 LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
          WHERE subscribes.user_id = ?
        `;
        return await db.all(sql, userId);
    } catch (e) {
        throw new Error('DB_ERROR');
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
        throw new Error('DB_ERROR');
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
        throw new Error('DB_ERROR');
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
        throw new Error('DB_ERROR');
    }
};

px.getAllFeedsWithCount = async () => {
    try {
        const db = await dbPomise;
        return await db.all(`SELECT subscribes.feed_id, COUNT(rf.feed_id) AS sub_count, rf.feed_title, rf.url
                             FROM subscribes
                                    LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                             GROUP BY subscribes.feed_id`);
    } catch (e) {
        throw new Error('DB_ERROR');
    }
};

module.exports = px;
