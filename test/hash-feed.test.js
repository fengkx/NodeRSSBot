const { atom, rss, noKey } = require('./test-data/feed_items');
const crypto = require('crypto');

const hashFeed = require('../utils/hash-feed');

test('atom hash', async () => {
    const md5 = crypto.createHash('md5');
    md5.update(atom.id);
    await expect(hashFeed(atom)).resolves.toEqual(
        md5.digest('hex').substr(0, 8)
    );
});

test('rss hash', async () => {
    const md5 = crypto.createHash('md5');
    md5.update(rss.guid);
    await expect(hashFeed(rss)).resolves.toEqual(
        md5.digest('hex').substr(0, 8)
    );
});

test('no key hash', async () => {
    const md5 = crypto.createHash('md5');
    md5.update(noKey.link + noKey.title);
    await expect(hashFeed(noKey)).resolves.toEqual(
        md5.digest('hex').substr(0, 8)
    );
});
