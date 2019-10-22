const util = require('util');
const fs = require('fs');

const source = require('./test-data/feeds');
const getOutlines = require('../middlewares/import-from-opml')._getOutlines;
const readFile = util.promisify(fs.readFile);

test('getOutlines', async () => {
    const str = await readFile(__dirname + '/test-data/opml.opml', 'utf8');
    let feedList = await getOutlines(str);
    feedList = feedList.map((item, index) => {
        return {
            feed_id: index + 1,
            feed_title: item.text,
            url: item.xmlUrl
        };
    });
    expect(feedList).toEqual(source);
});
