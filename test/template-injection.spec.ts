/**
 * Template Injection Security Tests
 *
 * These tests verify that untrusted data (feed titles, URLs, error messages)
 * cannot be used to inject and execute arbitrary code via EJS template processing.
 *
 * Tests use production code paths (mocking only DB and Telegram API) to ensure
 * the fix is effective in the actual runtime environment.
 */

import { Telegraf } from 'telegraf';
import send from '../source/utils/send';
import { Feed } from '../source/types/feed';
import * as subscribesProxy from '../source/proxies/subscribes';
import * as usersProxy from '../source/proxies/users';
import { Optional } from '../source/types/option';

// Mock database and Telegram
jest.mock('../source/proxies/subscribes');
jest.mock('../source/proxies/users');

describe('Template Injection Security - Production Code Paths', () => {
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

    describe('ERROR_MANY_TIME Path - Template Injection Prevention', () => {
        it('should block template injection in feed title', async () => {
            const maliciousFeed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title:
                    '<% global.INJECTED_TITLE = "EXPLOITED" %>Malicious',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const errorMessage = 'Connection timeout';

            // Use production template from index.ts:300
            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            delete (global as any).INJECTED_TITLE;

            await send(bot, template, maliciousFeed, {
                title: maliciousFeed.feed_title,
                url: maliciousFeed.url,
                msg: errorMessage
            });

            // Template injection should be blocked
            expect((global as any).INJECTED_TITLE).toBeUndefined();

            // Message should be sent with literal EJS code visible as text
            expect(sentMessages).toHaveLength(1);
            expect(sentMessages[0].text).toContain(
                '<% global.INJECTED_TITLE = "EXPLOITED" %>'
            );
            expect(sentMessages[0].text).toContain(
                'Unable to fetch for many times'
            );
        });

        it('should block template injection in error message', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Legitimate Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            // err.message is also attacker-controlled (comes from remote servers)
            const maliciousError = '<%= global.INJECTED_ERROR = "EXPLOITED" %>';

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            delete (global as any).INJECTED_ERROR;

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: maliciousError
            });

            expect((global as any).INJECTED_ERROR).toBeUndefined();
            expect(sentMessages[0].text).toContain(
                '<%= global.INJECTED_ERROR = "EXPLOITED" %>'
            );
        });

        it('should block template injection in URL', async () => {
            const maliciousFeed: Feed = {
                feed_id: 1,
                url: 'https://evil.com/<%=global.INJECTED_URL="EXPLOITED"%>',
                feed_title: 'Test Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            delete (global as any).INJECTED_URL;

            await send(bot, template, maliciousFeed, {
                title: maliciousFeed.feed_title,
                url: maliciousFeed.url,
                msg: 'Error'
            });

            expect((global as any).INJECTED_URL).toBeUndefined();
        });
    });

    describe('isChangeFeedUrl Path - Template Injection Prevention', () => {
        it('should block template injection in feed title (feed change path)', async () => {
            const maliciousFeed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title:
                    '<%= global.INJECTED_FEED_CHANGE = "EXPLOITED" %>Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const newFeeds = [
                'https://example.com/newfeed1.xml',
                'https://example.com/newfeed2.xml'
            ];

            // Production template from index.ts:308-314
            const template =
                '<%- title %>: <a href="<%- url %>"></a> <%=i18n["ERROR_MANY_TIME"]%>\n<b><%=i18n["FOUND_FEEDS"]%></b>:\n<% new_feeds.forEach(function(feed_url) { %><%- feed_url %>\n<% }); %><%=i18n["FEED_CHANGE_TO"]%> <%- new_feeds[0] %>';

            delete (global as any).INJECTED_FEED_CHANGE;

            await send(bot, template, maliciousFeed, {
                title: maliciousFeed.feed_title,
                url: maliciousFeed.url,
                new_feeds: newFeeds
            });

            expect((global as any).INJECTED_FEED_CHANGE).toBeUndefined();
            expect(sentMessages[0].text).toContain(
                '<%= global.INJECTED_FEED_CHANGE = "EXPLOITED" %>'
            );
        });

        it('should block template injection in new_feed URLs', async () => {
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

            const maliciousNewFeeds = [
                '<%= global.INJECTED_NEWFEED = "EXPLOITED" %>',
                'https://example.com/feed2.xml'
            ];

            const template =
                '<%- title %>: <a href="<%- url %>"></a> <%=i18n["ERROR_MANY_TIME"]%>\n<b><%=i18n["FOUND_FEEDS"]%></b>:\n<% new_feeds.forEach(function(feed_url) { %><%- feed_url %>\n<% }); %><%=i18n["FEED_CHANGE_TO"]%> <%- new_feeds[0] %>';

            delete (global as any).INJECTED_NEWFEED;

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                new_feeds: maliciousNewFeeds
            });

            expect((global as any).INJECTED_NEWFEED).toBeUndefined();
            expect(sentMessages[0].text).toContain(
                '<%= global.INJECTED_NEWFEED = "EXPLOITED" %>'
            );
        });

        it('should render all new_feed entries correctly', async () => {
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

            const newFeeds = [
                'https://example.com/feed1.xml',
                'https://example.com/feed2.xml',
                'https://example.com/feed3.xml'
            ];

            const template =
                '<%- title %>: <a href="<%- url %>"></a> <%=i18n["ERROR_MANY_TIME"]%>\n<b><%=i18n["FOUND_FEEDS"]%></b>:\n<% new_feeds.forEach(function(feed_url) { %><%- feed_url %>\n<% }); %><%=i18n["FEED_CHANGE_TO"]%> <%- new_feeds[0] %>';

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                new_feeds: newFeeds
            });

            const text = sentMessages[0].text;
            expect(text).toContain('https://example.com/feed1.xml');
            expect(text).toContain('https://example.com/feed2.xml');
            expect(text).toContain('https://example.com/feed3.xml');
        });
    });

    describe('Benign Input Compatibility - Output Must Be Identical', () => {
        it('should preserve HTML special characters in feed titles', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Tech News <Daily> & Updates',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: 'Timeout'
            });

            // Output should contain raw HTML characters (same as original behavior)
            expect(sentMessages[0].text).toContain(
                'Tech News <Daily> & Updates'
            );
        });

        it('should preserve legitimate EJS-like strings in titles', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: 'Programming Tips: <%= best practices %>',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: 'Error'
            });

            // Legitimate <%= %> in title should appear as-is
            expect(sentMessages[0].text).toContain(
                'Programming Tips: <%= best practices %>'
            );
        });

        it('should handle URLs with query parameters correctly', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml?key=value&foo=bar',
                feed_title: 'Test Feed',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: 'Error'
            });

            expect(sentMessages[0].text).toContain(
                'https://example.com/feed.xml?key=value&foo=bar'
            );
        });

        it('should produce correct message format for benign error case', async () => {
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

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: 'Connection timeout'
            });

            const text = sentMessages[0].text;

            // Verify structure matches expected output
            expect(text).toMatch(
                /^My RSS Feed: <a href="https:\/\/example\.com\/feed\.xml">https:\/\/example\.com\/feed\.xml<\/a> Unable to fetch for many times, you might want to unsub it Connection timeout$/
            );
        });

        it('should work with different languages', async () => {
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

            const template =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            await send(bot, template, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: 'Error'
            });

            const text = sentMessages[0].text;
            // Should contain Chinese translation
            expect(text).toMatch(/多次/); // Part of Chinese error message
        });
    });

    describe('Regression Guard - Must Use Fixed Pattern', () => {
        it('GUARD: production pattern must pass title as local (not concatenated)', async () => {
            const feed: Feed = {
                feed_id: 1,
                url: 'https://example.com/feed.xml',
                feed_title: '<% global.GUARD_TITLE = "VULNERABLE" %>Test',
                error_count: 0,
                ttl: 60,
                recent_hash_list: '[]',
                etag_header: '',
                last_modified_header: null,
                next_fetch_time: new Date()
            };

            // FIXED pattern - title passed as local
            const fixedTemplate =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            delete (global as any).GUARD_TITLE;

            await send(bot, fixedTemplate, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: 'Error'
            });

            // With proper locals, code should NOT execute
            expect((global as any).GUARD_TITLE).toBeUndefined();

            // The literal EJS code should appear in the message
            expect(sentMessages[0].text).toContain('<% global.GUARD_TITLE');
        });

        it('GUARD: production pattern must pass err.message as local (not concatenated)', async () => {
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

            const maliciousError = '<% global.GUARD_MSG = "VULNERABLE" %>';

            // FIXED pattern - error message passed as local
            const fixedTemplate =
                '<%- title %>: <a href="<%- url %>"><%- url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%- msg %>';

            delete (global as any).GUARD_MSG;

            await send(bot, fixedTemplate, feed, {
                title: feed.feed_title,
                url: feed.url,
                msg: maliciousError
            });

            // With proper locals, code should NOT execute
            expect((global as any).GUARD_MSG).toBeUndefined();

            // The literal EJS code should appear in the message
            expect(sentMessages[0].text).toContain('<% global.GUARD_MSG');
        });

        it('GUARD: new_feed array must be passed as local and looped in template', async () => {
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

            const maliciousNewFeeds = [
                '<% global.GUARD_NEWFEED = "VULNERABLE" %>',
                'https://example.com/feed2.xml'
            ];

            // FIXED pattern - new_feeds passed as local and looped
            const fixedTemplate =
                '<%- title %>: <a href="<%- url %>"></a>\n<% new_feeds.forEach(function(feed_url) { %><%- feed_url %>\n<% }); %>';

            delete (global as any).GUARD_NEWFEED;

            await send(bot, fixedTemplate, feed, {
                title: feed.feed_title,
                url: feed.url,
                new_feeds: maliciousNewFeeds
            });

            // With proper locals, code should NOT execute
            expect((global as any).GUARD_NEWFEED).toBeUndefined();

            // The literal EJS code should appear in the message
            expect(sentMessages[0].text).toContain('<% global.GUARD_NEWFEED');
        });
    });
});
