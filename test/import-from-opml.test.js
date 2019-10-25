const importFromOpml = require('../middlewares/import-from-opml').default;

jest.mock('../proxies/rss-feed', () => ({
    sub: jest.fn()
}));

jest.mock('../utils/got', () => {
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
    const ctx = require('./test-data/ctx/import-from-opml-ctx');
    await importFromOpml(ctx, jest.fn());
    let feeds = require('./test-data/feeds');
    feeds.map((item) => {
        item.type = 'rss';
        item.text = item.feed_title;
        item.xmlUrl = item.url;
        delete item.feed_id;
        delete item.url;
        delete item.feed_title;
        return item;
    });
    expect(ctx).toHaveProperty('state.outlines');
    expect(ctx).toHaveProperty('state.processMesId');
});
