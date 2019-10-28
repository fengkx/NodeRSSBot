const dbPool = require('../database');
const errors = require('../utils/errors');

// eslint-disable-next-line no-empty-function
const placeHolder = { release() {} };
const px = {};
px.getSubscribersByFeedId = async (feedId) => {
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
};

px.deleteSubscribersByUserId = async (userId) => {
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
};

module.exports = px;
