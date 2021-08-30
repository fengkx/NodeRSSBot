import errors from '../utils/errors.js';
import { Subscribe } from '../types/subscribe';
import { db } from '../database/index.js';

export async function getSubscribersByFeedId(
    feedId: number
): Promise<Subscribe[]> {
    try {
        return await db<Subscribe>('subscribes')
            .where('feed_id', feedId)
            .select();
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function deleteSubscribersByUserId(
    userId: number
): Promise<number> {
    try {
        return await db('subscribes').where('user_id', userId).del();
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}
