import { Feed } from '../source/types/feed';
import { Optional } from '../source/types/option';

function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
    });
    return { promise, resolve, reject };
}

function buildFeed(
    feedId = 1,
    url = `https://example.com/${feedId}.xml`
): Feed {
    return {
        feed_id: feedId,
        url,
        feed_title: `feed-${feedId}`,
        recent_hash_list: '[]',
        error_count: 0,
        next_fetch_time: '2026-01-01 00:00:00',
        etag_header: '',
        last_modified_header: '',
        ttl: 20
    };
}

type FetchModule = typeof import('../source/utils/fetch');

async function loadFetchModule(
    configOverrides: Record<string, unknown> = {},
    poolOverrides: Record<string, unknown> = {}
): Promise<{
    fetchModule: FetchModule;
    gotMock: jest.Mock;
    loggerMock: {
        info: jest.Mock;
        error: jest.Mock;
        debug: jest.Mock;
    };
    logHttpErrorMock: jest.Mock;
    feedUtils: {
        findFeed: jest.Mock;
        getNewItems: jest.Mock;
    };
    proxies: {
        getAllFeeds: jest.Mock;
        updateHashList: jest.Mock;
        failAttempt: jest.Mock;
        updateFeed: jest.Mock;
        handleRedirect: jest.Mock;
    };
    sentryMock: {
        captureException: jest.Mock;
    };
}> {
    jest.resetModules();

    const gotMock = jest.fn();
    const loggerMock = {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    };
    const logHttpErrorMock = jest.fn();
    const feedUtils = {
        findFeed: jest.fn(),
        getNewItems: jest.fn(async () => [[], []])
    };
    const proxies = {
        getAllFeeds: jest.fn(async () => []),
        updateHashList: jest.fn(async () => undefined),
        failAttempt: jest.fn(() =>
            Promise.resolve(require('../source/types/option').none)
        ),
        updateFeed: jest.fn(async () => 1),
        handleRedirect: jest.fn(async () => undefined)
    };
    const sentryMock = {
        captureException: jest.fn()
    };

    jest.doMock('../source/utils/got', () => ({
        __esModule: true,
        default: gotMock
    }));
    jest.doMock('../source/utils/logger', () => ({
        __esModule: true,
        default: loggerMock,
        logHttpError: logHttpErrorMock
    }));
    jest.doMock('../source/utils/feed', () => feedUtils);
    jest.doMock('../source/proxies/rss-feed', () => proxies);
    jest.doMock('../source/database', () => ({
        db: {
            client: {
                pool: {
                    numUsed: () => 0,
                    numFree: () => 0,
                    numPendingAcquires: () => 0,
                    numPendingCreates: () => 0,
                    ...poolOverrides
                }
            }
        }
    }));
    jest.doMock('@sentry/node', () => ({
        captureException: sentryMock.captureException,
        init: jest.fn(),
        rewriteFramesIntegration: jest.fn(() => ({})),
        withScope: (
            cb: (scope: { setTag: jest.Mock; setExtras: jest.Mock }) => void
        ) =>
            cb({
                setTag: jest.fn(),
                setExtras: jest.fn()
            })
    }));
    jest.doMock('../source/config', () => ({
        config: {
            notify_error_count: 5,
            item_num: 10,
            concurrency: 8,
            fetch_gap: '20m',
            db_pool_max: 15,
            strict_ttl: true,
            sentry_dsn: '',
            GAP_MINUTES: 20,
            PKG_ROOT: '/tmp',
            ...configOverrides
        }
    }));

    const fetchModule =
        require('../source/utils/fetch') as typeof import('../source/utils/fetch');

    return {
        fetchModule,
        gotMock,
        loggerMock,
        logHttpErrorMock,
        feedUtils,
        proxies,
        sentryMock
    };
}

describe('fetch worker runtime', () => {
    test('samples worker memory at startup and every three minutes', async () => {
        const { fetchModule, loggerMock } = await loadFetchModule();
        jest.useFakeTimers();
        const listeners = jest.spyOn(process, 'on').mockReturnValue(process);
        const samples = () =>
            loggerMock.info.mock.calls.filter(
                ([entry]) => entry.message === 'fetch worker memory'
            );
        try {
            fetchModule.startFetchWorker();
            expect(samples()).toHaveLength(1);
            expect(samples()[0][0]).toMatchObject({
                rss: expect.any(Number),
                heapTotal: expect.any(Number),
                heapUsed: expect.any(Number),
                external: expect.any(Number),
                arrayBuffers: expect.any(Number)
            });
            jest.advanceTimersByTime(179_999);
            expect(samples()).toHaveLength(1);
            jest.advanceTimersByTime(1);
            expect(samples()).toHaveLength(2);
            jest.advanceTimersByTime(180_000);
            expect(samples()).toHaveLength(3);
        } finally {
            listeners.mockRestore();
            jest.useRealTimers();
        }
    });

    test('caps effective concurrency using database pool size', async () => {
        const { fetchModule } = await loadFetchModule({
            concurrency: 10,
            db_pool_max: 5
        });

        expect(fetchModule.effectiveConcurrency).toBe(3);
        expect(fetchModule.getFetchRuntimeState()).toEqual(
            expect.objectContaining({
                configuredConcurrency: 10,
                effectiveConcurrency: 3,
                dbPoolMax: 5
            })
        );
    });

    test('logs pool metrics with their receiver and tolerates unavailable metrics', async () => {
        const { fetchModule, loggerMock } = await loadFetchModule(
            {},
            {
                used: [1, 2],
                numUsed(this: { used: number[] }) {
                    return this.used.length;
                },
                numPendingAcquires: () => 3,
                numPendingCreates() {
                    throw new Error('metric unavailable');
                }
            }
        );

        await fetchModule.fetchAll();
        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'fetch round scheduled',
                used: 2,
                free: 0,
                pendingAcquires: 3,
                pendingCreates: undefined
            })
        );
    });

    test('waits for updateFeed before returning on 304 responses', async () => {
        const { fetchModule, gotMock, proxies } = await loadFetchModule();
        const updateDeferred = deferred<number>();
        const feed = buildFeed();

        gotMock.mockResolvedValue({
            status: 304,
            url: feed.url,
            headers: new Headers(),
            textConverted: jest.fn()
        });
        proxies.updateFeed.mockReturnValue(updateDeferred.promise);

        const pending = fetchModule.fetch(feed);
        let settled = false;
        pending.then(() => {
            settled = true;
        });

        await Promise.resolve();
        expect(settled).toBe(false);

        updateDeferred.resolve(1);
        const result = await pending;
        expect(typeof result).toBe('symbol');
    });

    test('waits for error follow-up work before finishing fetch', async () => {
        const { fetchModule, gotMock, proxies, feedUtils } =
            await loadFetchModule();
        const textDeferred = deferred<string>();
        const feed = buildFeed();

        gotMock
            .mockRejectedValueOnce(new Error('network failed'))
            .mockResolvedValueOnce({
                textConverted: jest.fn(() => textDeferred.promise)
            });
        proxies.failAttempt.mockResolvedValue(
            Optional({
                ...feed,
                error_count: 5
            })
        );
        feedUtils.findFeed.mockResolvedValue(['https://example.com/new.xml']);

        const pending = fetchModule.fetch(feed);
        let settled = false;
        pending.then(() => {
            settled = true;
        });

        await Promise.resolve();
        await Promise.resolve();
        expect(settled).toBe(false);

        textDeferred.resolve('<html></html>');
        const result = await pending;
        expect(typeof result).toBe('symbol');
        expect(proxies.failAttempt).toHaveBeenCalledTimes(1);
        expect(proxies.handleRedirect).toHaveBeenCalledTimes(1);
        expect(proxies.handleRedirect).toHaveBeenCalledWith(
            feed.url,
            'https://example.com/new.xml'
        );
    });

    test.each(['read', 'parse'])('counts a %s failure once', async (stage) => {
        const { fetchModule, gotMock, proxies } = await loadFetchModule();
        const feed = buildFeed();
        gotMock.mockResolvedValue({
            status: 200,
            url: feed.url,
            textConverted: async () => {
                if (stage === 'read') throw new Error('truncated body');
                return '<html></html>';
            }
        });
        await fetchModule.fetch(feed);
        expect(proxies.failAttempt).toHaveBeenCalledTimes(1);
        expect(gotMock).toHaveBeenCalledTimes(1);
    });

    test.each([301, 304])(
        'does not count database failures on HTTP %i',
        async (status) => {
            const { fetchModule, gotMock, proxies } = await loadFetchModule();
            const feed = buildFeed();
            const error = new Error('database unavailable');
            gotMock.mockResolvedValue({ status, url: feed.url + '/new' });
            proxies.updateFeed.mockRejectedValue(error);
            proxies.handleRedirect.mockRejectedValue(error);
            await expect(fetchModule.fetch(feed)).rejects.toBe(error);
            expect(proxies.failAttempt).not.toHaveBeenCalled();
        }
    );

    test('fetchAll resolves only after queued feeds complete', async () => {
        const { fetchModule, gotMock, proxies } = await loadFetchModule();
        const firstUpdate = deferred<number>();
        const secondUpdate = deferred<number>();
        const feedOne = buildFeed(1);
        const feedTwo = buildFeed(2);

        proxies.getAllFeeds.mockResolvedValue([feedOne, feedTwo]);
        proxies.updateFeed
            .mockReturnValueOnce(firstUpdate.promise)
            .mockReturnValueOnce(secondUpdate.promise);
        gotMock.mockImplementation(async (url: string) => ({
            status: 304,
            url,
            headers: new Headers(),
            textConverted: jest.fn()
        }));

        const pending = fetchModule.fetchAll();
        let settled = false;
        pending.then(() => {
            settled = true;
        });

        await Promise.resolve();
        expect(settled).toBe(false);

        firstUpdate.resolve(1);
        await Promise.resolve();
        expect(settled).toBe(false);

        secondUpdate.resolve(1);
        await pending;
        expect(gotMock).toHaveBeenCalledTimes(2);
    });

    test('skips overlapping fetch rounds', async () => {
        const { fetchModule, gotMock, proxies, loggerMock } =
            await loadFetchModule();
        const updateDeferred = deferred<number>();
        const feed = buildFeed();

        proxies.getAllFeeds.mockResolvedValue([feed]);
        proxies.updateFeed.mockReturnValue(updateDeferred.promise);
        gotMock.mockResolvedValue({
            status: 304,
            url: feed.url,
            headers: new Headers(),
            textConverted: jest.fn()
        });

        const firstRun = fetchModule.run();
        await Promise.resolve();
        await fetchModule.run();

        expect(gotMock).toHaveBeenCalledTimes(1);
        expect(loggerMock.info).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'skip fetch round',
                isFetchingRound: true
            })
        );

        updateDeferred.resolve(1);
        await firstRun;
    });

    test('deduplicates feeds already in flight', async () => {
        const { fetchModule, gotMock, proxies } = await loadFetchModule();
        const feed = buildFeed();

        proxies.getAllFeeds.mockResolvedValue([feed, { ...feed }]);
        gotMock.mockResolvedValue({
            status: 304,
            url: feed.url,
            headers: new Headers(),
            textConverted: jest.fn()
        });

        await fetchModule.fetchAll();
        expect(gotMock).toHaveBeenCalledTimes(1);
    });
});
