import got from '../source/utils/got';
const nock = require('nock');
import { config } from '../source/config';
import { createServer } from 'http2';
interface AddressInfo {
    address: string;
    family: string;
    port: number;
}

describe('ensure got work', () => {
    test('work on http1', async () => {
        nock('https://node_rssbot.test')
            .get('/test')
            .reply(function () {
                const ua = this.req.headers['user-agent'];
                expect(ua).toBe(config.UA);
                return [200, ''];
            });
        const resp = await got('https://node_rssbot.test/test', {
            http2: false
        });
        expect(resp.statusCode).toBe(200);
    });

    test('work on http2', async () => {
        const srv = createServer();
        srv.on('stream', (stream) => {
            // stream is a Duplex
            stream.respond({
                'content-type': 'text/plain',
                ':status': 200
            });
            stream.end('Http2');
        });
        srv.listen(async () => {
            const { port } = srv.address() as AddressInfo;
            const resp = await got(`http://localhost:${port}`);
            expect(resp.statusCode).toBe(200);
            expect(resp.body).toBe('Http2');
        }).close();
    });
});
