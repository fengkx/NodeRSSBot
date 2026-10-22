/**
 * Notification Template Security Tests
 *
 * These tests verify that feed titles, URLs, and error messages in notification
 * templates are properly escaped and cannot inject Telegram HTML or malformed markup.
 *
 * Tests use the actual production message construction functions to ensure the fix
 * is effective at the real call sites.
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

// Mock database and Telegram
jest.mock('../source/proxies/subscribes');
jest.mock('../source/proxies/users');

describe('Notification Template Security - Production Functions', () => {
    let bot: Telegraf;
    let sentMessages: Array<{
        userId: number;
        text: string;
        options: any;
    }>;
    const mockUserId = 12345;

    beforeEach(() => {
        // Reset mocks
        sentMessages = [];

        // Create bot with mocked telegram API
        bot = new Telegraf('mock-token');
        bot.telegram.sendMessage = jest.fn(
            async (userId: number, text: string, options?: any) => {
                sentMessages.push({ userId, text, options });
                return {} as any;
            }
        );

        // Mock database responses
        (subscribesProxy.getSubscribersByFeedId as jest.Mock).mockResolvedValue(
            [{ user_id: mockUserId, feed_id: 1 }]
        );

        (usersProxy.getUserById as jest.Mock).mockResolvedValue(
            Optional({ user_id: mockUserId, lang: 'en', username: 'test' })
        );
    });

    describe('Error Notification - buildErrorNotification()', () => {
        it('should escape HTML special characters in all positions (full message)', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed?a=1&b=2',
                feed_title: 'Tech News <Daily> & "Updates"',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Error: <Server> & "Bad"' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            expect(sentMessages).toHaveLength(1);
            const text = sentMessages[0].text;

            // Full-text assertion - changing any <%= to <%- would fail this
            expect(text).toBe(
                'Tech News &lt;Daily&gt; &amp; &#34;Updates&#34;: ' +
                    '<a href="https://example.com/feed?a=1&amp;b=2">https://example.com/feed?a=1&amp;b=2</a> ' +
                    'Unable to fetch for many times, you might want to unsub it ' +
                    'Error: &lt;Server&gt; &amp; &#34;Bad&#34;'
            );
        });

        it('should escape single quotes in title and error', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: "It's News & 'Updates'",
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: "Can't connect & 'timeout'" };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Full-text assertion with single quotes
            expect(text).toBe(
                'It&#39;s News &amp; &#39;Updates&#39;: ' +
                    '<a href="https://example.com/feed.xml">https://example.com/feed.xml</a> ' +
                    'Unable to fetch for many times, you might want to unsub it ' +
                    'Can&#39;t connect &amp; &#39;timeout&#39;'
            );
        });

        it('should escape all special characters in URL query params', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed?x=<val>&y="test"&z=\'quote\'',
                feed_title: 'Test',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Timeout' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // URL with complex query string - both in href and link text
            expect(text).toContain(
                '<a href="https://example.com/feed?x=&lt;val&gt;&amp;y=&#34;test&#34;&amp;z=&#39;quote&#39;">'
            );
            expect(text).toContain(
                'https://example.com/feed?x=&lt;val&gt;&amp;y=&#34;test&#34;&amp;z=&#39;quote&#39;</a>'
            );
        });

        it('should render literal EJS delimiters in feed title', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Tips: <%= var %> and <% code %>',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Timeout' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // EJS delimiters should be escaped
            expect(text).toContain(
                'Tips: &lt;%= var %&gt; and &lt;% code %&gt;'
            );
        });

        it('should produce correct message for plain input', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'My RSS Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Connection timeout' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Plain inputs - byte-identical to master
            expect(text).toBe(
                'My RSS Feed: <a href="https://example.com/feed.xml">https://example.com/feed.xml</a> ' +
                    'Unable to fetch for many times, you might want to unsub it Connection timeout'
            );
        });
    });

    describe('Feed Change Notification - buildFeedChangeNotification()', () => {
        it('should escape HTML in all positions including repeated URL (full message)', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/old?a=1&b=2',
                feed_title: 'News <Daily> & "Updates"',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

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

            const text = sentMessages[0].text;

            // Full-text assertion - any <%- would break this
            expect(text).toBe(
                'News &lt;Daily&gt; &amp; &#34;Updates&#34;: ' +
                    '<a href="https://example.com/old?a=1&amp;b=2"></a> ' +
                    'Unable to fetch for many times, you might want to unsub it\n' +
                    '<b>Found feeds</b>:\n' +
                    'https://example.com/new1?x=1&amp;y=2\n' +
                    'https://example.com/new2?p=&lt;val&gt;&amp;q=&#34;test&#34;\n' +
                    'Feed Change to https://example.com/new1?x=1&amp;y=2'
            );
        });

        it('should escape special chars in all new feed URLs', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Test',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

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

            // Each URL should appear escaped in the list
            expect(text).toContain('https://ex.com/f1?a=1&amp;b=2&amp;c=3\n');
            expect(text).toContain(
                'https://ex.com/f2?x=&lt;&gt;&amp;y=&#34;&#39;\n'
            );
            expect(text).toContain('https://ex.com/f3?z=3\n');

            // First URL also appears at the end (repeated) - must be escaped there too
            expect(text).toContain(
                'Feed Change to https://ex.com/f1?a=1&amp;b=2&amp;c=3'
            );
        });

        it('should render literal EJS delimiters in new feed URLs', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Test',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const newFeedUrls = ['https://ex.com/<%= id %>/feed.xml'];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // EJS delimiters should be escaped in both list and trailing URL
            expect(text).toContain('https://ex.com/&lt;%= id %&gt;/feed.xml\n');
            expect(text).toContain(
                'Feed Change to https://ex.com/&lt;%= id %&gt;/feed.xml'
            );
        });

        it('should produce correct structure for plain inputs', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Test Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

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

            const text = sentMessages[0].text;

            // Plain inputs - byte-identical to expected
            expect(text).toBe(
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
        it('should escape ampersands exactly once in URLs with query params', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed?a=1&b=2&c=3',
                feed_title: 'Test',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Timeout' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Should contain &amp; not &amp;amp; (would indicate double-escaping)
            expect(text).toContain('?a=1&amp;b=2&amp;c=3');
            expect(text).not.toContain('&amp;amp;');
        });

        it('should not double-escape already-escaped entities in feed change URLs', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Test',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const newFeedUrls = ['https://example.com/rss?a=1&b=2'];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Should be escaped exactly once
            expect(text).toContain('?a=1&amp;b=2');
            expect(text).not.toContain('&amp;amp;');
        });
    });

    describe('Multi-Language Support', () => {
        it('should work with Chinese language (full message with special chars)', async () => {
            // Mock Chinese user
            (usersProxy.getUserById as jest.Mock).mockResolvedValue(
                Optional({
                    user_id: mockUserId,
                    lang: 'zh-cn',
                    username: 'test'
                })
            );

            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed?a=1&b=2',
                feed_title: '科技新闻 <每日> & "更新"',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Connection timeout' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Full message with Chinese title and i18n text, special chars escaped
            expect(text).toBe(
                '科技新闻 &lt;每日&gt; &amp; &#34;更新&#34;: ' +
                    '<a href="https://example.com/feed?a=1&amp;b=2">https://example.com/feed?a=1&amp;b=2</a> ' +
                    '多次抓取失败，建议取消订阅 Connection timeout'
            );
        });
    });

    describe('Feed Discovery Integration', () => {
        it('should handle entity-encoded URLs from HTML href attributes', async () => {
            // This tests the complete flow: HTML with encoded entities ->
            // findFeed decodes -> notification builders escape for Telegram
            const feed: Feed = {
                feed_id: 1,
                // Simulate URL that came from HTML: href="...?a=1&amp;b=2"
                // After findFeed decoding, it's raw: ...?a=1&b=2
                // Then notification escapes it once for output
                url: 'https://example.com/rss?a=1&b=2',
                feed_title: 'Discovered Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = { message: 'Failed' };
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Should be escaped exactly once (not double-escaped)
            expect(text).toContain('https://example.com/rss?a=1&amp;b=2');
            expect(text).not.toContain('&amp;amp;');
        });
    });
});
