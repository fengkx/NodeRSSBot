import fs from 'fs';
import { config as cfg } from '../source/config';
import initDB from '../source/database/init-tables';
beforeAll(() => {
    if (fs.existsSync(cfg.db_path)) {
        fs.unlinkSync(cfg.db_path);
    }
    initDB();
});

import * as RSS from '../source/proxies/rss-feed';
import * as USERS from '../source/proxies/users';
import * as SUBSCRIBES from '../source/proxies/subscribes';
import { isSome, Some } from '../source/types/option';
import { Feed } from '../source/types/feed';

const [userId, feedUrl, feedTitle] = [
    233233233,
    'http://test.test',
    'test-title'
];

test('RSS sub', async () => {
    const r = await RSS.sub(userId, feedUrl, feedTitle);
    expect(r).toEqual('ok');
    const feed = (await RSS.getFeedByUrl(feedUrl)) as Some<Feed>;
    const subscriptions = await SUBSCRIBES.getSubscribersByFeedId(
        feed.value.feed_id
    );
    const sub = subscriptions[0];
    expect(sub).toHaveProperty('user_id', userId);
});

test('RSS getAllFeeds', async () => {
    const allFeeds = await RSS.getAllFeeds();
    const feed = (await RSS.getFeedByUrl('http://test.test')) as Some<Feed>;
    expect(allFeeds).toEqual(expect.arrayContaining([feed.value]));
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
    expect(isSome(user));
    if (isSome(user)) {
        expect(user.value).toHaveProperty('user_id', userId);
        expect(user.value).toHaveProperty('lang', 'en');
    }
});

afterAll(() => {
    // const cfg = require('../config');
    if (fs.existsSync(cfg.db_path)) {
        fs.unlinkSync(cfg.db_path);
    }
});
