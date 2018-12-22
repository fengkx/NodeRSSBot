const dbPomise = require('../database');
const px = {};
px.getSubscribersByFeedId = async (feedId) => {
    const db = await dbPomise;
    return  await db.all(`SELECT * FROM subscribes WHERE feed_id=?`, feedId);
};

module.exports = px;
