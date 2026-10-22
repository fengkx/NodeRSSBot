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
        it('should escape HTML special characters in feed title', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Tech News <Daily> & "Updates"',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = new Error('Connection timeout');
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            expect(sentMessages).toHaveLength(1);
            const text = sentMessages[0].text;

            // Title should be HTML-escaped (EJS uses &#34; for quotes)
            expect(text).toContain(
                'Tech News &lt;Daily&gt; &amp; &#34;Updates&#34;'
            );
            // Link markup should remain literal
            expect(text).toContain('<a href="https://example.com/feed.xml">');
            // i18n text should be present
            expect(text).toContain(
                'Unable to fetch for many times, you might want to unsub it'
            );
            // Error message should be present
            expect(text).toContain('Connection timeout');
        });

        it('should escape HTML special characters in URL', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed?a=1&b=2',
                feed_title: 'Test Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = new Error('Timeout');
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            // URL with & should be escaped
            expect(text).toContain('https://example.com/feed?a=1&amp;b=2');
        });

        it('should escape HTML special characters in error message', async () => {
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

            const error = new Error(
                'Error: <Server> returned "Invalid" & failed'
            );
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            // Error message should be HTML-escaped (EJS uses &#34; for quotes)
            expect(text).toContain(
                'Error: &lt;Server&gt; returned &#34;Invalid&#34; &amp; failed'
            );
        });

        it('should render literal EJS delimiters in feed title', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Programming Tips: use <%= variable %> syntax',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = new Error('Timeout');
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;
            // EJS delimiters should be escaped and appear literally
            expect(text).toContain(
                'Programming Tips: use &lt;%= variable %&gt; syntax'
            );
        });

        it('should produce complete correct message for plain input', async () => {
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

            const error = new Error('Connection timeout');
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Complete message structure (plain inputs, no escaping needed)
            expect(text).toBe(
                'My RSS Feed: <a href="https://example.com/feed.xml">https://example.com/feed.xml</a> ' +
                    'Unable to fetch for many times, you might want to unsub it Connection timeout'
            );
        });
    });

    describe('Feed Change Notification - buildFeedChangeNotification()', () => {
        it('should escape HTML special characters in feed title', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'News <Daily> & Updates',
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

            // Title should be HTML-escaped
            expect(text).toContain('News &lt;Daily&gt; &amp; Updates');
        });

        it('should escape HTML special characters in all new feed URLs', async () => {
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
                'https://example.com/feed1?a=1&b=2',
                'https://example.com/feed2?x=<value>&y="test"',
                'https://example.com/feed3?z=3'
            ];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // All URLs should be HTML-escaped (EJS uses &#34; for quotes)
            expect(text).toContain('https://example.com/feed1?a=1&amp;b=2');
            expect(text).toContain(
                'https://example.com/feed2?x=&lt;value&gt;&amp;y=&#34;test&#34;'
            );
            expect(text).toContain('https://example.com/feed3?z=3');
        });

        it('should render all new feed URLs in the list', async () => {
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
                'https://example.com/feed1.xml',
                'https://example.com/feed2.xml',
                'https://example.com/feed3.xml'
            ];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // All three URLs should appear in order
            const feed1Idx = text.indexOf('https://example.com/feed1.xml');
            const feed2Idx = text.indexOf('https://example.com/feed2.xml');
            const feed3Idx = text.indexOf('https://example.com/feed3.xml');

            expect(feed1Idx).toBeGreaterThan(-1);
            expect(feed2Idx).toBeGreaterThan(feed1Idx);
            expect(feed3Idx).toBeGreaterThan(feed2Idx);
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

            const newFeedUrls = ['https://example.com/<%= id %>/feed.xml'];

            const [template, locals] = buildFeedChangeNotification(
                feed,
                newFeedUrls,
                encodeUrl
            );

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // EJS delimiters should be escaped and appear literally
            expect(text).toContain(
                'https://example.com/&lt;%= id %&gt;/feed.xml'
            );
        });

        it('should produce complete correct message structure', async () => {
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

            // Verify complete structure with newlines
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
        it('should not double-escape already-encoded URLs', async () => {
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

            const error = new Error('Timeout');
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // URL should appear with & escaped exactly once
            // If double-escaped, it would be &amp;amp;
            expect(text).not.toContain('&amp;amp;');
        });
    });

    describe('Multi-Language Support', () => {
        it('should work with Chinese language', async () => {
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
                url: 'https://example.com/feed.xml',
                feed_title: 'Test Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const error = new Error('Connection timeout');
            const [template, locals] = buildErrorNotification(feed, error);

            await send(bot, template, feed, locals);

            const text = sentMessages[0].text;

            // Should contain Chinese translation
            expect(text).toMatch(/多次/); // Part of Chinese error message
        });
    });
});
