import iconv from 'iconv-lite';
import got from '../source/utils/got';
const nock = require('nock');
import { config } from '../source/config';

describe('got', () => {
    test('should work on http1', async () => {
        nock('https://node_rssbot.test')
            .get('/test')
            .reply(function () {
                const ua = this.req.headers['user-agent'];
                expect(ua).toEqual([config.UA]);
                return [200, ''];
            });
        const resp = await got('https://node_rssbot.test/test');
        expect(resp.status).toBe(200);
    });

    test('should work on non UTF8 response', async () => {
        const text = '中文';
        nock('https://node_rssbot.test')
            .get('/test')
            .reply(200, iconv.encode(text, 'gbk'), {
                'content-type': 'text/plain charset=gbk'
            });
        const resp = await got('https://node_rssbot.test/test');
        const textReplyed = await resp.textConverted();
        expect(textReplyed).toBe(text);
    });
});
