import fs from 'fs';
import { config as cfg } from '../source/config';
import { initDB } from '../source/database';
beforeAll(async () => {
    if (fs.existsSync(cfg.db_path)) {
        fs.unlinkSync(cfg.db_path);
    }
    await initDB();
});

import * as RSS from '../source/proxies/rss-feed';
import * as USERS from '../source/proxies/users';
import * as SUBSCRIBES from '../source/proxies/subscribes';
import { isNone, isSome, Some } from '../source/types/option';
import { Feed } from '../source/types/feed';
import { getFeedByUrl, handleRedirect } from '../source/proxies/rss-feed';
import { getSubscribersByFeedId } from '../source/proxies/subscribes';

const [userId, feedUrl, feedTitle] = [
    233233233,
    'http://test.test/',
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
    const feed = (await RSS.getFeedByUrl(feedUrl)) as Some<Feed>;
    expect(allFeeds).toEqual(expect.arrayContaining([feed.value]));
});

test('RSS updateFeed', async () => {
    const feed = (await RSS.getFeedByUrl(feedUrl)) as Some<Feed>;
    RSS.updateFeed({
        feed_id: feed.value.feed_id,
        next_fetch_time: '3000-01-01'
    });
});
test('RSS getAllFeeds ttl', async () => {
    const allFeeds = await RSS.getAllFeeds();
    expect(allFeeds).toHaveLength(0);
    const feeds = await RSS.getAllFeeds(false);
    expect(feeds.length).toBeGreaterThan(0);
});

test('RSS handleRedirect', async () => {
    const [userId, title, url] = [123, 'title123', 'http://old'];
    const newUrl = 'http://new';
    await RSS.sub(userId, url, title);
    const feedOption = await getFeedByUrl(url);
    expect(isSome(feedOption)).toBe(true);
    const feedId = (feedOption as Some<Feed>).value.feed_id;
    await handleRedirect(url, newUrl);
    const feed = await RSS.getFeedById(feedId);
    expect(feed.url).toBe(newUrl);
    expect(isNone(await RSS.getFeedByUrl(url))).toBe(true);
    await RSS.sub(userId + 1, url, title);
    const oldUrlFeedOption = await RSS.getFeedByUrl(url);
    expect(isSome(oldUrlFeedOption)).toBe(true);
    await handleRedirect(url, newUrl);
    expect(await getSubscribersByFeedId(feedId)).toHaveLength(2);
    expect(
        await getSubscribersByFeedId(
            (oldUrlFeedOption as Some<Feed>).value.feed_id
        )
    ).toHaveLength(0);
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
    if (fs.existsSync(cfg.db_path)) {
        fs.unlinkSync(cfg.db_path);
    }
});
