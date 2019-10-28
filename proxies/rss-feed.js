const px = {};
const dbPool = require('../database');
const errors = require('../utils/errors');

// eslint-disable-next-line no-empty-function
const placeHolder = { release() {} };

px.sub = async (userId, feedUrl, feedTitle) => {
    feedUrl = decodeURI(feedUrl);
    const db = await dbPool.acquire();
    const feed = db
        .prepare(
            `SELECT *
             FROM rss_feed
             WHERE url = ?`
        )
        .get([feedUrl]);
    if (feed) {
        const sql = `SELECT *
                     FROM subscribes
                     WHERE user_id = ?
                       AND feed_id = ?`;
        const res = db.prepare(sql).all([userId, feed.feed_id]);
        if (res.length === 0) {
            db.prepare(
                'INSERT INTO subscribes(feed_id, user_id) VALUES (?, ?)'
            ).run([feed.feed_id, userId]);
            db.release();
            return 'ok';
        } else {
            db.release();
            throw errors.newCtrlErr('ALREADY_SUB');
        }
    } else {
        const info = db
            .prepare(
                `INSERT INTO rss_feed(url, feed_title)
                 VALUES (?, ?);`
            )
            .run(feedUrl, feedTitle);
        await db
            .prepare('INSERT INTO subscribes(feed_id, user_id) VALUES (?, ?)')
            .run([info.lastInsertRowid, userId]);
        db.release();
        return 'ok';
    }
};

px.getFeedByUrl = async (feedUrl) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const feed = db
            .prepare(
                `SELECT *
                 FROM rss_feed
                 WHERE url = ?`
            )
            .get([feedUrl]);
        return feed;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getFeedById = async (id) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const feed = db
            .prepare(
                `SELECT *
                 FROM rss_feed
                 WHERE feed_id = ?`
            )
            .get([id]);
        return feed;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.unsub = async (userId, feedId) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        db.prepare('DELETE FROM subscribes WHERE feed_id=? AND user_id=?').run([
            feedId,
            userId
        ]);
        return 'ok';
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getAllFeeds = async () => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const feeds = db
            .prepare(
                `SELECT rf.*
                             FROM subscribes
                                    LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                             GROUP BY rf.feed_id`
            )
            .all();
        return feeds;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.updateHashList = async (feedId, hashList) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        db.prepare(
            `UPDATE rss_feed
                 SET recent_hash_list=?
                 where feed_id = ?`
        ).run(JSON.stringify(hashList), feedId);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getFeedsByTitle = async (title) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return await db
            .prepare(
                `SELECT *
                 FROM rss_feed
                 WHERE feed_title = ?`
            )
            .all(title);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getSubscribedFeedsByUserId = async (userId, limit = 1000, page = 1) => {
    if (page < 1) {
        page = 1;
    }
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `
          SELECT rf.feed_id, rf.feed_title, rf.url
          FROM subscribes
                 LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
          WHERE subscribes.user_id = ? LIMIT ? OFFSET ?
        `;
        return db.prepare(sql).all(userId, limit, (page - 1) * limit);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getSubscribedCountByUserId = async (userId) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `SELECT COUNT(rf.feed_id) count
                     FROM subscribes
                              LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                     WHERE subscribes.user_id = ?
        `;
        const result = db.prepare(sql).get(userId);
        return result.count;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.resetErrorCount = async (feedUrl) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        db.prepare(
            `UPDATE rss_feed
                 SET error_count=0
                 WHERE url = ?`
        ).run(feedUrl);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.failAttempt = async (feedUrl) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `UPDATE rss_feed
                     SET error_count=error_count + 1
                     WHERE url = ? `;
        db.prepare(sql).run(feedUrl);
        return 'ok';
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.unsubAll = async (userId) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        db.prepare(
            `DELETE
                 FROM subscribes
                 WHERE user_id = ?`
        ).run(userId);
        return 'ok';
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getAllFeedsWithCount = async (limit, page) => {
    let db = placeHolder;
    if (page < 1) page = 1;
    try {
        db = await dbPool.acquire();
        return db
            .prepare(
                `SELECT subscribes.feed_id, COUNT(rf.feed_id) AS sub_count, rf.feed_title, rf.url
                FROM subscribes
                         LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id
                GROUP BY subscribes.feed_id
                ORDER BY sub_count DESC LIMIT ? OFFSET ?`
            )
            .all(limit, limit * (page - 1));
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.getAllFeedsCount = async () => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const result = db
            .prepare(
                `
        SELECT COUNT(DISTINCT rf.feed_id) as count
            FROM subscribes
            LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id`
            )
            .get();
        return result.count;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.handleRedirect = async (url, realUrl) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const oldFeed = db
            .prepare(`SELECT * FROM rss_feed WHERE url=?`)
            .get(url);
        const realFeed = db
            .prepare(`SELECT * FROM rss_feed WHERE url=?`)
            .get(realUrl);
        if (realFeed) {
            const updateSubStm = db.prepare(
                `UPDATE subscribes SET feed_id=? WHERE feed_id=?`
            );
            const delOldFeedStm = db.prepare(
                `DELETE FROM rss_feed WHERE url=?`
            );

            const handleFeedRedirect = db.transaction((oldFeed, realFeed) => {
                updateSubStm.run(realFeed.feed_id, oldFeed.feed_id);
                delOldFeedStm.run(oldFeed.url);
            });
            handleFeedRedirect(oldFeed, realFeed);
        } else {
            db.prepare(`UPDATE rss_feed SET url=? WHERE url=?`, realUrl).run(
                oldFeed.url
            );
        }
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};

px.updateFeedUrl = async (oldUrl, newUrl) => {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `UPDATE rss_feed
                 SET url=?
                 WHERE url = ?`;
        db.prepare(sql).run(newUrl, oldUrl);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
};
module.exports = px;
