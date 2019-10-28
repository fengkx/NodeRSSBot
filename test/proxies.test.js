const fs = require('fs');
const cfg = require('../config');

beforeAll(() => {
    if (fs.existsSync(cfg.db_path)) {
        fs.unlinkSync(cfg.db_path);
    }
    require('../database/init-tables')();
});

const RSS = require('../proxies/rss-feed');
const USERS = require('../proxies/users');
const SUBSCRIBES = require('../proxies/subscribes');

const [userId, feedUrl, feedTitle] = [
    233233233,
    'http://test.test',
    'test-title'
];

test('RSS sub', async () => {
    const r = await RSS.sub(userId, feedUrl, feedTitle);
    expect(r).toEqual('ok');
    const feed = await RSS.getFeedByUrl(feedUrl);
    const subscriptions = await SUBSCRIBES.getSubscribersByFeedId(feed.feed_id);
    const sub = subscriptions[0];
    expect(sub).toHaveProperty('user_id', userId);
});

test('RSS getAllFeeds', async () => {
    const allFeeds = await RSS.getAllFeeds();
    const feed = await RSS.getFeedByUrl('http://test.test');
    expect(allFeeds).toEqual(expect.arrayContaining([feed]));
});

test('RSS updateHashList', async () => {
    const id = 1;
    const hashList = ['abcdefg'];
    await RSS.updateHashList(id, hashList);
    const feed = await RSS.getFeedById(id);
    expect(feed).toHaveProperty('recent_hash_list', JSON.stringify(hashList));
});

test('RSS unsub', async () => {
    await RSS.unsub(userId, 1);
    // subscription deleted
    const subscribe = await SUBSCRIBES.getSubscribersByFeedId(1);
    expect(subscribe).toHaveProperty('length', 0);
    const feed = await RSS.getFeedById(1);
    expect(feed).toHaveProperty('feed_id', 1); // feed exist
});

test('USER new', async () => {
    await USERS.newUser(userId, 'en');
    const user = await USERS.getUserById(userId);
    expect(user).toHaveProperty('user_id', userId);
    expect(user).toHaveProperty('lang', 'en');
});

afterAll(() => {
    // const cfg = require('../config');
    fs.unlinkSync(cfg.db_path);
});
