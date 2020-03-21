import dbPool from '../database';
import errors from '../utils/errors';
import { Subscribe } from '../types/subscribe';
import * as Database from 'better-sqlite3';

// eslint-disable-next-line no-empty-function, @typescript-eslint/no-empty-function
const placeHolder: any = { available: false, release() {} };

export async function getSubscribersByFeedId(
    feedId: number
): Promise<Subscribe[]> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return db
            .prepare(
                `SELECT *
             FROM subscribes
             WHERE feed_id = ?`
            )
            .all(feedId);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}

export async function deleteSubscribersByUserId(
    userId: number
): Promise<Database.RunResult> {
    let db = placeHolder;
    try {
        db = await dbPool.acquire();
        return await db
            .prepare('DELETE FROM "subscribes" WHERE user_id = ?')
            .run(userId);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    } finally {
        db.release();
    }
}
