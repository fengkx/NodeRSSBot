import { db } from '../database';
import errors from '../utils/errors';
import { Feed } from '../types/feed';
import { Subscribe } from '../types/subscribe';
import { isSome, Option, Optional, Some } from '../types/option';
import { decodeUrl } from '../utils/urlencode';

export async function sub(
    userId: number,
    feedUrl: string,
    feedTitle: string,
    ttl = 0
): Promise<'ok'> {
    feedUrl = decodeUrl(feedUrl);
    const feed = await db<Feed>('rss_feed').where('url', feedUrl).first();
    if (feed) {
        const res = await db<Subscribe>('subscribes')
            .where('user_id', userId)
            .andWhere('feed_id', feed.feed_id)
            .select();
        if (res.length === 0) {
            await db<Subscribe>('subscribes').insert(
                {
                    feed_id: feed.feed_id,
                    user_id: userId
                },
                'subscribe_id'
            );
            return 'ok';
        } else {
            throw errors.newCtrlErr('ALREADY_SUB');
        }
    } else {
        await db.transaction(async (trx) => {
            let [feed_id] = await db('rss_feed')
                .insert(
                    {
                        url: feedUrl,
                        feed_title: feedTitle,
                        ttl: ttl
                    },
                    'feed_id'
                )
                .returning('feed_id')
                .transacting(trx);
            if (typeof feed_id === 'object') {
                feed_id = feed_id.feed_id; // pg return object
            }
            await db('subscribes')
                .insert({ feed_id, user_id: userId }, 'subscribe_id')
                .transacting(trx);
        });

        return 'ok';
    }
}

export async function getFeedByUrl(feedUrl: string): Promise<Option<Feed>> {
    try {
        const feed = await db<Feed>('rss_feed').where('url', feedUrl).first();
        return Optional(feed);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

/**
 * get feed by id
 * @param {number} id feed id
 */
export async function getFeedById(id: number): Promise<Feed> {
    try {
        const feed: Feed = await db<Feed>('rss_feed')
            .where('feed_id', id)
            .first();
        return feed;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function unsub(userId: number, feedId: number): Promise<void> {
    try {
        await db('subscribes')
            .where('feed_id', feedId)
            .andWhere('user_id', userId)
            .del();
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function getAllFeeds(ttl = true): Promise<Feed[]> {
    try {
        let query = db('rss_feed').whereIn(
            'feed_id',
            db('subscribes').distinct('feed_id')
        );
        if (ttl) {
            query = query.where('next_fetch_time', '<', db.fn.now());
        }
        const feeds = await query.orderByRaw('random()').select();

        return feeds;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function updateHashList(
    feedId: number,
    hashList: string[]
): Promise<void> {
    try {
        return await db<Feed>('rss_feed')
            .where('feed_id', feedId)
            .update({ recent_hash_list: JSON.stringify(hashList) });
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function getFeedsByTitle(title: string): Promise<Feed[]> {
    try {
        return await db<Feed>('rss_feed').where('feed_title', title).select();
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
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
    try {
        return await db<Feed>('subscribes')
            .leftJoin('rss_feed as rf', 'subscribes.feed_id', 'rf.feed_id')
            .where('subscribes.user_id', userId)
            .limit(limit)
            .offset((page - 1) * limit)
            .select('rf.feed_title')
            .select('rf.url')
            .select('rf.feed_id');
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function getSubscribedCountByUserId(
    userId: number
): Promise<number> {
    try {
        const result = await db('subscribes')
            .leftJoin('rss_feed as rf', 'subscribes.feed_id', 'rf.feed_id')
            .where('subscribes.user_id', userId)
            .count({ count: 'rf.feed_id' })
            .first();
        return result.count;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function updateFeed(
    feed: Partial<Feed> & { feed_id: number }
): Promise<number> {
    try {
        const { feed_id, ...rest } = feed;
        return await db('rss_feed').where('feed_id', feed_id).update(rest);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function failAttempt(feedUrl: string): Promise<number> {
    try {
        return await db('rss_feed')
            .where('url', feedUrl)
            .increment('error_count', 1);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function unsubAll(userId: number): Promise<number> {
    try {
        return await db('subscribes').where('user_id', userId).del();
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function getAllFeedsWithCount(
    limit: number,
    page: number
): Promise<Feed[]> {
    if (page < 1) page = 1;
    try {
        const feedIdCountTable = db('subscribes')
            .groupBy('feed_id')
            .orderBy('sub_count', 'desc')
            .limit(limit)
            .offset(limit * (page - 1))
            .select('feed_id')
            .as('feed_id_count')
            .count({ sub_count: '*' });
        const rssFeedTable = db('rss_feed')
            .select('feed_title')
            .select('url')
            .select('feed_id')
            .as('rss_feed_t');

        const rt = db(feedIdCountTable)
            .innerJoin(
                rssFeedTable,
                'feed_id_count.feed_id',
                'rss_feed_t.feed_id'
            )
            .select('sub_count')
            .select('url')
            .select('feed_title');
        return await rt;
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function getAllFeedsCount(): Promise<number> {
    try {
        const result = await db('subscribes')
            .countDistinct({ count: 'feed_id' })
            .first();
        return parseInt(result.count);
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}
export async function handleRedirect(
    url: string,
    realUrl: string
): Promise<void> {
    try {
        realUrl = decodeUrl(realUrl);
        const oldFeed: Option<Feed> = Optional(
            await db<Feed>('rss_feed').where('url', url).first()
        );
        const realFeed: Option<Feed> = Optional(
            await db<Feed>('rss_feed').where('url', realUrl).first()
        );
        if (isSome(realFeed) && isSome(oldFeed)) {
            // we have feed entry for both url
            // update the subscribes entry to new real url one
            // then del the subscribes entry with old url
            await db.transaction(async (trx) => {
                await trx('subscribes')
                    .where('feed_id', oldFeed.value.feed_id)
                    .update({ feed_id: realFeed.value.feed_id });
                await trx('subscribes')
                    .where('feed_id', oldFeed.value.feed_id)
                    .del();
            });
        } else {
            await db('rss_feed')
                .where('url', (oldFeed as Some<Feed>).value.url)
                .update({ url: realUrl });
        }
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function updateFeedUrl(
    oldUrl: string,
    newUrl: string
): Promise<number> {
    try {
        return await db('rss_feed')
            .where('url', oldUrl)
            .update({ url: newUrl });
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function getActiveFeedWithErrorCount(
    largerThan = -1
): Promise<Feed[]> {
    try {
        return await db<Feed>('subscribes')
            .leftJoin('rss_feed as rf', 'subscribes.feed_id', 'rf.feed_id')
            .where('error_count', '>', largerThan)
            .groupBy('rf.feed_id')
            .orderBy('rf.error_count', 'desc')
            .select('rf.feed_id')
            .select('rf.feed_title')
            .select('rf.url')
            .select('rf.error_count');
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}

export async function batchUnsubByFeedIds(ids: number[]): Promise<void> {
    try {
        await db.transaction(async (trx) => {
            await Promise.all(
                ids.map(async (id) =>
                    trx('subscribes').where('feed_id', id).del()
                )
            );
        });
    } catch (e) {
        throw errors.newCtrlErr('DB_ERROR', e);
    }
}
