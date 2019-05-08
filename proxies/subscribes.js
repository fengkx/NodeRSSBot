const dbPomise = require('../database');
const px = {};
px.getSubscribersByFeedId = async (feedId) => {
    const db = await dbPomise;
    return await db.all(
        `SELECT *
         FROM subscribes
         WHERE feed_id = ?`,
        feedId
    );
};

px.deleteSubscribersByUserId = async (userId) => {
    const db = await dbPomise;
    return await db.run('DELETE FROM "subscribes" WHERE user_id = ?', userId);
};

module.exports = px;
