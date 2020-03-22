import testFeeds from './test-data/feeds';
import ctx from './test-data/ctx/import-from-opml-ctx';
import importFromOpml from '../source/middlewares/import-from-opml';
import { Feed } from '../source/types/feed';
import { Outline } from '../source/types/outline';
import { MContext } from '../source/types/ctx';

jest.mock('../source/proxies/rss-feed', () => ({
    sub: jest.fn()
}));

jest.mock('../source/utils/got', () => {
    const { promisify } = require('util');
    const fs = require('fs');

    return {
        get: jest.fn(async () => {
            const body = await promisify(fs.readFile)(
                'test/test-data/opml.opml',
                'utf8'
            );
            return { body };
        })
    };
});

test('import from opml', async () => {
    await importFromOpml((ctx as unknown) as MContext, jest.fn());
    const feeds = testFeeds;
    feeds.map(
        (item: Feed): Outline => {
            return { type: 'rss', text: item.feed_title, xmlUrl: item.url };
        }
    );
    expect(ctx).toHaveProperty('state.outlines');
    expect(ctx).toHaveProperty('state.processMsgId');
});
