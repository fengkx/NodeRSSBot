import iconv from 'iconv-lite';
import got from '../source/utils/got';
import { config } from '../source/config';
import createTestServer from 'create-test-server';

jest.setTimeout(10 * 1000);

const text = '中文';
let server: Awaited<ReturnType<typeof createTestServer>>;
describe('got', () => {
    beforeAll(async () => {
        server = await createTestServer();
        server.get('/testUA', (req, res) => {
            const ua = req.headers['user-agent'];
            expect(ua).toEqual(config.UA);
            res.status(200).end('1');
        });

        server.get('/testGBK', (_req, res) => {
            res.setHeader('content-type', 'text/plain charset=gbk');
            res.send(iconv.encode(text, 'gbk'));
        });

        server.get('/testGB2312', (_req, res) => {
            res.setHeader('content-type', 'text/plain charset=gbk');
            res.send(iconv.encode(text, 'gb2312'));
        });

        server.get('/test304', (_req, res) => {
            res.status(304).send('');
        });
    });
    afterAll(async () => {
        await server.close();
    });
    test('should work on http1', async () => {
        const resp = await got(`${server.url}/testUA`);
        expect(resp.status).toBe(200);
    });

    test('should work on non UTF8 response', async () => {
        const resp = await got(`${server.url}/testGBK`);
        const textReplied = await resp.textConverted();
        expect(textReplied).toBe(text);

        const resp2 = await got(`${server.url}/testGB2312`);
        const textReplied2 = await resp2.textConverted();
        expect(textReplied2).toBe(text);
    });

    test('should not throw but return empty body in 304 Not Modified', async () => {
        const resp = await got(`${server.url}/test304`);
        expect(resp.status).toBe(304);
        expect(await resp.textConverted()).toBe('');
    });
});
