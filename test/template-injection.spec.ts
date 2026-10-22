/**
 * Notification Template Security Tests
 *
 * Verify that feed-controlled data (titles, URLs, error messages) in error and
 * feed-change notifications is properly escaped to prevent Telegram HTML injection.
 *
 * All tests use production message builders to ensure real code paths are covered.
 */

import { Telegraf } from 'telegraf';
import send from '../source/utils/send';
import { Feed } from '../source/types/feed';
import * as subscribesProxy from '../source/proxies/subscribes';
import * as usersProxy from '../source/proxies/users';
import { Optional } from '../source/types/option';
import {
    buildErrorNotification,
    buildFeedChangeNotification
} from '../source/utils/notification-messages';
import { encodeUrl } from '../source/utils/urlencode';

jest.mock('../source/proxies/subscribes');
jest.mock('../source/proxies/users');

// Test feed factory
function createTestFeed(overrides: Partial<Feed> = {}): Feed {
    return {
        feed_id: 1,
        url: 'https://example.com/feed.xml',
        feed_title: 'Test Feed',
        error_count: 0,
        ttl: 60,
        recent_hash_list: '[]',
        etag_header: '',
        last_modified_header: null,
        next_fetch_time: new Date(),
        ...overrides
    };
}

describe('Notification Template Security', () => {
    let bot: Telegraf;
    let sentMessages: Array<{ userId: number; text: string; options: any }>;
    const mockUserId = 12345;

    beforeEach(() => {
        sentMessages = [];

        bot = new Telegraf('mock-token');
        bot.telegram.sendMessage = jest.fn(async (userId, text, options) => {
            sentMessages.push({ userId, text, options });
            return {} as any;
        });

        (subscribesProxy.getSubscribersByFeedId as jest.Mock).mockResolvedValue(
            [{ user_id: mockUserId, feed_id: 1 }]
        );

        (usersProxy.getUserById as jest.Mock).mockResolvedValue(
            Optional({ user_id: mockUserId, lang: 'en', username: 'test' })
        );
    });

    describe('Error Notifications', () => {
        it('escapes HTML chars in title, URL, and error message', async () => {
            const feed = createTestFeed({
                url: 'https://example.com/feed?a=1&b=2',
                feed_title: 'Tech News <Daily> & "Updates"'
            });
            const error = { message: 'Error: <Server> & "Bad"' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toBe(
                'Tech News &lt;Daily&gt; &amp; &#34;Updates&#34;: ' +
                    '<a href="https://example.com/feed?a=1&amp;b=2">https://example.com/feed?a=1&amp;b=2</a> ' +
                    'Unable to fetch for many times, you might want to unsub it ' +
                    'Error: &lt;Server&gt; &amp; &#34;Bad&#34;'
            );
        });

        it('escapes single quotes in title and error', async () => {
            const feed = createTestFeed({
                feed_title: "It's News & 'Updates'"
            });
            const error = { message: "Can't connect & 'timeout'" };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toBe(
                'It&#39;s News &amp; &#39;Updates&#39;: ' +
                    '<a href="https://example.com/feed.xml">https://example.com/feed.xml</a> ' +
                    'Unable to fetch for many times, you might want to unsub it ' +
                    'Can&#39;t connect &amp; &#39;timeout&#39;'
            );
        });

        it('escapes special chars in URL query params (href and link text)', async () => {
            const feed = createTestFeed({
                url: 'https://example.com/feed?x=<val>&y="test"&z=\'quote\''
            });
            const error = { message: 'Timeout' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            expect(text).toContain(
                '<a href="https://example.com/feed?x=&lt;val&gt;&amp;y=&#34;test&#34;&amp;z=&#39;quote&#39;">'
            );
            expect(text).toContain(
                'https://example.com/feed?x=&lt;val&gt;&amp;y=&#34;test&#34;&amp;z=&#39;quote&#39;</a>'
            );
        });

        it('renders literal EJS delimiters as text', async () => {
            const feed = createTestFeed({
                feed_title: 'Tips: <%= var %> and <% code %>'
            });
            const error = { message: 'Timeout' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toContain(
                'Tips: &lt;%= var %&gt; and &lt;% code %&gt;'
            );
        });

        it('renders plain inputs identically to previous behavior', async () => {
            const feed = createTestFeed({ feed_title: 'My RSS Feed' });
            const error = { message: 'Connection timeout' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toBe(
                'My RSS Feed: <a href="https://example.com/feed.xml">https://example.com/feed.xml</a> ' +
                    'Unable to fetch for many times, you might want to unsub it Connection timeout'
            );
        });
    });

    describe('Feed Change Notifications', () => {
        it('escapes HTML in title, URLs, and repeated trailing URL', async () => {
            const feed = createTestFeed({
                url: 'https://example.com/old?a=1&b=2',
                feed_title: 'News <Daily> & "Updates"'
            });
            const newFeedUrls = [
                'https://example.com/new1?x=1&y=2',
                'https://example.com/new2?p=<val>&q="test"'
            ];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toBe(
                'News &lt;Daily&gt; &amp; &#34;Updates&#34;: ' +
                    '<a href="https://example.com/old?a=1&amp;b=2"></a> ' +
                    'Unable to fetch for many times, you might want to unsub it\n' +
                    '<b>Found feeds</b>:\n' +
                    'https://example.com/new1?x=1&amp;y=2\n' +
                    'https://example.com/new2?p=&lt;val&gt;&amp;q=&#34;test&#34;\n' +
                    'Feed Change to https://example.com/new1?x=1&amp;y=2'
            );
        });

        it('escapes special chars in all list items and trailing URL', async () => {
            const feed = createTestFeed();
            const newFeedUrls = [
                'https://ex.com/f1?a=1&b=2&c=3',
                'https://ex.com/f2?x=<>&y="\'',
                'https://ex.com/f3?z=3'
            ];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );
            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            expect(text).toContain('https://ex.com/f1?a=1&amp;b=2&amp;c=3\n');
            expect(text).toContain(
                'https://ex.com/f2?x=&lt;&gt;&amp;y=&#34;&#39;\n'
            );
            expect(text).toContain(
                'Feed Change to https://ex.com/f1?a=1&amp;b=2&amp;c=3'
            );
        });

        it('renders literal EJS delimiters in feed URLs', async () => {
            const feed = createTestFeed();
            const newFeedUrls = ['https://ex.com/<%= id %>/feed.xml'];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );
            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            expect(text).toContain('https://ex.com/&lt;%= id %&gt;/feed.xml\n');
            expect(text).toContain(
                'Feed Change to https://ex.com/&lt;%= id %&gt;/feed.xml'
            );
        });

        it('renders plain inputs with correct structure', async () => {
            const feed = createTestFeed();
            const newFeedUrls = [
                'https://example.com/newfeed1.xml',
                'https://example.com/newfeed2.xml'
            ];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toBe(
                'Test Feed: <a href="https://example.com/feed.xml"></a> ' +
                    'Unable to fetch for many times, you might want to unsub it\n' +
                    '<b>Found feeds</b>:\n' +
                    'https://example.com/newfeed1.xml\n' +
                    'https://example.com/newfeed2.xml\n' +
                    'Feed Change to https://example.com/newfeed1.xml'
            );
        });
    });

    describe('No Double Escaping', () => {
        it('escapes ampersands exactly once in error URLs', async () => {
            const feed = createTestFeed({
                url: 'https://example.com/feed?a=1&b=2&c=3'
            });
            const error = { message: 'Timeout' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toContain('?a=1&amp;b=2&amp;c=3');
            expect(sentMessages[0].text).not.toContain('&amp;amp;');
        });

        it('escapes ampersands exactly once in feed change URLs', async () => {
            const feed = createTestFeed();
            const newFeedUrls = ['https://example.com/rss?a=1&b=2'];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toContain('?a=1&amp;b=2');
            expect(sentMessages[0].text).not.toContain('&amp;amp;');
        });
    });

    describe('Internationalization', () => {
        it('works with Chinese language and special chars', async () => {
            (usersProxy.getUserById as jest.Mock).mockResolvedValue(
                Optional({
                    user_id: mockUserId,
                    lang: 'zh-cn',
                    username: 'test'
                })
            );

            const feed = createTestFeed({
                url: 'https://example.com/feed?a=1&b=2',
                feed_title: '科技新闻 <每日> & "更新"'
            });
            const error = { message: 'Connection timeout' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            expect(sentMessages[0].text).toBe(
                '科技新闻 &lt;每日&gt; &amp; &#34;更新&#34;: ' +
                    '<a href="https://example.com/feed?a=1&amp;b=2">https://example.com/feed?a=1&amp;b=2</a> ' +
                    '多次抓取失败，建议取消订阅 Connection timeout'
            );
        });
    });

    describe('Feed Discovery Integration', () => {
        it('handles entity-decoded URLs from HTML discovery', async () => {
            // URL decoded from HTML href="...?a=1&amp;b=2" by findFeed()
            const feed = createTestFeed({
                url: 'https://example.com/rss?a=1&b=2'
            });
            const error = { message: 'Failed' };

            const [template, locals] = buildErrorNotification(feed, error);
            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            expect(text).toContain('https://example.com/rss?a=1&amp;b=2');
            expect(text).not.toContain('&amp;amp;');
        });
    });
});
