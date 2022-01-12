import iconv from 'iconv-lite';
import got from '../source/utils/got';
const nock = require('nock');
import { config } from '../source/config';

describe('got', () => {
    test('should work on http1', async () => {
        nock('https://node_rssbot.test')
            .get('/testUA')
            .reply(function () {
                const ua = this.req.headers['user-agent'];
                expect(ua).toEqual([config.UA]);
                return [200, ''];
            });
        const resp = await got('https://node_rssbot.test/testUA');
        expect(resp.status).toBe(200);
    });

    test('should work on non UTF8 response', async () => {
        const text = '中文';
        nock('https://node_rssbot.test')
            .get('/testGBK')
            .reply(200, iconv.encode(text, 'gbk'), {
                'content-type': 'text/plain charset=gbk'
            });
        const resp = await got('https://node_rssbot.test/testGBK');
        const textReplyed = await resp.textConverted();
        expect(textReplyed).toBe(text);

        nock('https://node_rssbot.test')
            .get('/testGB2312')
            .reply(200, iconv.encode(text, 'gb2312'), {
                'content-type': 'text/plain charset=gbk'
            });
        const resp2 = await got('https://node_rssbot.test/testGB2312');
        const textReplyed2 = await resp2.textConverted();
        expect(textReplyed2).toBe(text);
    });

    test('should not throw but return empty body in 304 Not Modified', async () => {
        nock('https://node_rssbot.test').get('/test304').reply(304);
        const resp = await got('https://node_rssbot.test/test304');
        expect(resp.status).toBe(304);
        expect(await resp.textConverted()).toBe('');
    });
});
