import path from 'path';
import makeFetchHappen from 'make-fetch-happen';
import { config } from '../config';
import { proxyUrl } from './agent';

// @ts-expect-error make fetch happen textConverted function optional dependency
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import encoding from 'encoding';

export type FetchResponse = Awaited<ReturnType<makeFetchHappen.FetchInterface>>;
// eslint-lint-disable-next-line @typescript-eslint/naming-convention
export class HTTPError extends Error {
    public response: FetchResponse;
    public request: Request;
    public options: makeFetchHappen.FetchOptions;

    constructor(
        response: FetchResponse,
        options: makeFetchHappen.FetchOptions
    ) {
        const code =
            response.status || response.status === 0 ? response.status : '';
        const title = response.statusText || '';
        const status = `${code} ${title}`.trim();
        const reason = status ? `status code ${status}` : 'an unknown error';

        super(`Request failed with ${reason}`);

        this.name = 'HTTPError';
        this.response = response;
        this.options = options;
    }
}

const AcceptHeader =
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 ';

const cachePath = path.join(config['PKG_ROOT'], 'data', 'fetch-cache');

export const request = makeFetchHappen.defaults({
    headers: {
        'user-agent': config.UA,
        accept: AcceptHeader
    },
    timeout: config.resp_timeout * 1000,
    proxy: proxyUrl,
    retry: {
        randomize: true,
        maxTimeout: 30 * 1000,
        retries: 5
    },
    cachePath
});

export default async function fetch(
    url: RequestInfo,
    options?: makeFetchHappen.FetchOptions
): Promise<FetchResponse> {
    const res = await request(url, options);
    if (!res.ok && res.status !== 304) {
        throw new HTTPError(res, options);
    }
    return res;
}
