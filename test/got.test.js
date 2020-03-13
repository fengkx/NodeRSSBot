const got = require('../utils/got');
const nock = require('nock');
const config = require('../config');

test('ensure got work', async () => {
    nock('https://node_rssbot.test')
        .get('/test')
        .twice() // no charset header cause afterRespone hook to resend a requst for buffer responseType
        .reply(function() {
            const ua = this.req.headers['user-agent'];
            expect(ua).toBe(config.UA);
            return [200, ''];
        });
    const resp = await got('https://node_rssbot.test/test');
    expect(resp.statusCode).toBe(200);
});
