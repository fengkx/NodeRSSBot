import dbPool from '../database';
import errors from '../utils/errors';
import { PoolConnection } from 'better-sqlite-pool';
import * as Database from 'better-sqlite3';
import { Feed } from '../types/feed';
import { isSome, Option, Optional, Some } from '../types/option';

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
const placeHolder: any = { available: false, release() {} };

export async function sub(
    userId: number,
    feedUrl: string,
    feedTitle: string
): Promise<string> {
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
}

export async function getFeedByUrl(feedUrl: string): Promise<Option<Feed>> {
    let db: PoolConnection = placeHolder;
    try {
        db = await dbPool.acquire();
        const feed: Feed = db
            .prepare(
                `SELECT *
                 FROM rss_feed
                 WHERE url = ?`
            )
            .get([feedUrl]);
        return Optional(feed);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

/**
 * get feed by id
 * @param {number} id feed id
 */
export async function getFeedById(id: number): Promise<Feed> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const feed: Feed = db
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
}

export async function unsub(
    userId: number,
    feedId: number
): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return db
            .prepare('DELETE FROM subscribes WHERE feed_id=? AND user_id=?')
            .run([feedId, userId]);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function getAllFeeds(): Promise<Feed[]> {
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
}

export async function updateHashList(
    feedId: number,
    hashList: string[]
): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return db
            .prepare(
                `UPDATE rss_feed
                 SET recent_hash_list=?
                 where feed_id = ?`
            )
            .run(JSON.stringify(hashList), feedId);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function getFeedsByTitle(title: string): Promise<Feed[]> {
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
}

export async function getSubscribedFeedsByUserId(
    userId: number,
    limit = 1000,
    page = 1
): Promise<Feed[]> {
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
}

export async function getSubscribedCountByUserId(
    userId: number
): Promise<number> {
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
}

export async function resetErrorCount(feedUrl: string): Promise<void> {
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
}

export async function failAttempt(
    feedUrl: string
): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `UPDATE rss_feed
                     SET error_count=error_count + 1
                     WHERE url = ? `;
        return db.prepare(sql).run(feedUrl);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function unsubAll(userId: number): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return db
            .prepare(
                `DELETE
                 FROM subscribes
                 WHERE user_id = ?`
            )
            .run(userId);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function getAllFeedsWithCount(
    limit: number,
    page: number
): Promise<Feed[]> {
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
}

export async function getAllFeedsCount(): Promise<number> {
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
}

export async function handleRedirect(
    url: string,
    realUrl: string
): Promise<void> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const oldFeed: Option<Feed> = Optional(
            db.prepare(`SELECT * FROM rss_feed WHERE url=?`).get(url)
        );
        const realFeed: Option<Feed> = Optional(
            db.prepare(`SELECT * FROM rss_feed WHERE url=?`).get(realUrl)
        );
        if (isSome(realFeed) && isSome(oldFeed)) {
            const updateSubStm = db.prepare(
                `UPDATE subscribes SET feed_id=? WHERE feed_id=?`
            );
            const delOldFeedStm = db.prepare(
                `DELETE FROM rss_feed WHERE url=?`
            );

            const handleFeedRedirect = db.transaction(
                (oldFeed: Feed, realFeed: Feed) => {
                    updateSubStm.run(realFeed.feed_id, oldFeed.feed_id);
                    delOldFeedStm.run(oldFeed.url);
                }
            );
            handleFeedRedirect(oldFeed.value, realFeed.value);
        } else {
            db.prepare(`UPDATE rss_feed SET url=? WHERE url=?`).run(
                (oldFeed as Some<Feed>).value.url,
                realUrl
            );
        }
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function updateFeedUrl(
    oldUrl: string,
    newUrl: string
): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const sql = `UPDATE rss_feed
                 SET url=?
                 WHERE url = ?`;
        return db.prepare(sql).run(newUrl, oldUrl);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function getActiveFeedWithErrorCount(
    largerThan = -1
): Promise<Feed[]> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const result = db
            .prepare(
                `SELECT rf.feed_id, rf.feed_title, rf.url, rf.error_count FROM subscribes LEFT JOIN rss_feed rf on subscribes.feed_id = rf.feed_id WHERE error_count > ? GROUP BY rf.feed_id ORDER BY rf.error_count DESC;`
            )
            .all(largerThan);
        return result;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function batchUnsubByFeedIds(ids: number[]) {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        const unsubStm = db.prepare(`DELETE FROM subscribes WHERE feed_id=?`);
        const unsubBatch = db.transaction((ids: number[]) => {
            ids.forEach((id) => {
                unsubStm.run(id);
            });
        });
        return unsubBatch(ids);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}
