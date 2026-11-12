import { mkdtempSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Feed } from '../source/types/feed';
import { isSome, none } from '../source/types/option';

const dir = mkdtempSync(join(tmpdir(), 'rssbot-backoff-'));
// On Heroku, DYNO makes the app use DATABASE_URL instead of the test database.
delete process.env.DYNO;
process.env.RSSBOT_DB_PATH =
    process.env.TEST_BACKOFF_PG_URL || join(dir, 'test.db');
process.env.RSSBOT_FETCH_GAP = process.env.TEST_BACKOFF_GAP || '11m';
process.env.NOTIFY_ERR_COUNT = '3';

const { db, initDB } =
    require('../source/database') as typeof import('../source/database');
const { failAttempt, getAllFeeds, sub } =
    require('../source/proxies/rss-feed') as typeof import('../source/proxies/rss-feed');
const url = `https://backoff.example/${randomUUID()}`;
const threshold = 3;
const gap = process.env.RSSBOT_FETCH_GAP.endsWith('h')
    ? parseInt(process.env.RSSBOT_FETCH_GAP) * 60
    : parseInt(process.env.RSSBOT_FETCH_GAP);
const originalTime = '2001-01-01 00:00:00';
const now = Date.UTC(2030, 0, 1);

beforeAll(async () => {
    await initDB();
    await sub(1, url, 'Backoff test');
});

afterAll(async () => {
    await db.destroy();
    rmSync(dir, { recursive: true, force: true });
});

test('uses one update per failure, including for a missing feed', async () => {
    const queries: string[] = [];
    const record = (q: { sql: string }) => queries.push(q.sql);
    db.on('query', record);
    try {
        expect(isSome(await failAttempt(url))).toBe(true);
        expect(await failAttempt(url + '/missing')).toBe(none);
    } finally {
        db.removeListener('query', record);
    }
    expect(queries).toHaveLength(2);
    for (const sql of queries) {
        expect(sql.replace(/\s+/g, ' ')).toMatch(/^update .*returning/i);
    }
});

test('increments and returns the updated count across all retry tiers', async () => {
    await db('rss_feed')
        .where({ url })
        .update({ error_count: 0, next_fetch_time: originalTime });
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    try {
        const multipliers = [0, 0, 2, 2, 2, 4, 4, 4, 4, 4, 4, 8, 8];
        for (const [index, multiplier] of multipliers.entries()) {
            const result = await failAttempt(url);
            if (!isSome(result)) throw new Error('Missing feed');
            expect(result.value.error_count).toBe(index + 1);

            // Read the stored UTC fields before pg interprets them in the process timezone.
            const stored = await db('rss_feed')
                .where({ url })
                .first(db.raw('CAST(next_fetch_time AS TEXT) AS retry_time'));
            const expected = multiplier
                ? new Date(now + multiplier * gap * 60000)
                      .toISOString()
                      .slice(0, 19)
                      .replace('T', ' ')
                : originalTime;
            expect(stored).toHaveProperty('retry_time', expected);
        }
    } finally {
        clock.mockRestore();
    }
});

test.each([
    [0, false, false, true],
    [threshold - 1, false, false, true],
    [threshold, false, false, false],
    [threshold, true, true, true],
    [0, true, true, true]
])(
    'selects subscribed feeds with count %i and due %s',
    async (count, due, strict, relaxed) => {
        await db('rss_feed')
            .where({ url })
            .update({
                error_count: count,
                next_fetch_time: due ? originalTime : '2099-01-01 00:00:00'
            });
        expect((await getAllFeeds(true)).some((feed) => feed.url === url)).toBe(
            strict
        );
        expect(
            (await getAllFeeds(false)).some((feed) => feed.url === url)
        ).toBe(relaxed);
    }
);

test('excludes unsubscribed feeds in both TTL modes', async () => {
    const orphan = url + '/unsubscribed';
    await db('rss_feed').insert({ url: orphan, feed_title: 'Unsubscribed' });
    for (const strict of [true, false]) {
        expect(
            (await getAllFeeds(strict)).some((feed) => feed.url === orphan)
        ).toBe(false);
    }
});

jest.mock('../source/utils/got', () => ({
    __esModule: true,
    default: jest.fn()
}));

test.each([200, 304])(
    'restores normal scheduling after HTTP %i',
    async (status) => {
        const { fetch } =
            require('../source/utils/fetch') as typeof import('../source/utils/fetch');
        const got = jest.requireMock('../source/utils/got')
            .default as jest.Mock;
        await db('rss_feed').where({ url }).update({
            error_count: 12,
            next_fetch_time: originalTime,
            ttl: gap
        });
        const feed = await db<Feed>('rss_feed').where({ url }).first();
        got.mockResolvedValue({
            status,
            url,
            headers: new Headers(),
            textConverted: async () =>
                '<rss version="2.0"><channel><title>Recovered</title></channel></rss>'
        });
        await fetch(feed!);
        expect(
            await db('rss_feed').where({ url }).first('error_count')
        ).toEqual({ error_count: 0 });
        expect((await getAllFeeds(true)).some((row) => row.url === url)).toBe(
            false
        );
        expect((await getAllFeeds(false)).some((row) => row.url === url)).toBe(
            true
        );
    }
);
