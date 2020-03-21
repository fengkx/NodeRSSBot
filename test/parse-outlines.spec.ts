const util = require('util');
const fs = require('fs');

import source from './test-data/feeds';
import { _getOutlines } from '../source/middlewares/import-from-opml';
const getOutlines = _getOutlines;
const readFile = util.promisify(fs.readFile);

test('getOutlines', async () => {
    const str = await readFile(__dirname + '/test-data/opml.opml', 'utf8');
    const feedList = await getOutlines(str);
    const outlines = feedList.map((item, index) => {
        return {
            feed_id: index + 1,
            feed_title: item.text,
            url: item.xmlUrl
        };
    });
    expect(outlines).toEqual(source);
});
