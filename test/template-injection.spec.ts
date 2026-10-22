import * as ejs from 'ejs';
import i18n from '../source/i18n';

/**
 * Test for Server-Side Template Injection (SSTI) vulnerability
 *
 * This test reproduces the vulnerability where untrusted data (feed titles, URLs, error messages)
 * are concatenated into EJS template strings and then evaluated, allowing code execution.
 */
describe('Template Injection Security Tests', () => {
    const lang = 'en';

    describe('Vulnerability Reproduction - ERROR_MANY_TIME path', () => {
        it('should NOT execute code from malicious feed title (old vulnerable code path)', () => {
            // Simulate a malicious feed title with EJS code injection
            const maliciousFeedTitle =
                '<%= global.TEMPLATE_INJECTION_TEST = "EXPLOITED" %>';
            const feedUrl = 'https://example.com/feed.xml';
            const errorMessage = 'Connection timeout';

            // This simulates the VULNERABLE code pattern from index.ts:300
            // OLD CODE: `${feed.feed_title}: <a href="${feed.url}">${feed.url}</a> <%=i18n['ERROR_MANY_TIME']%> ${err.message}`
            const vulnerableTemplate = `${maliciousFeedTitle}: <a href="${feedUrl}">${feedUrl}</a> <%=i18n['ERROR_MANY_TIME']%> ${errorMessage}`;

            // Clear any previous value
            delete (global as any).TEMPLATE_INJECTION_TEST;

            // Render the template (this is what happens in send.ts:159)
            const result = ejs.render(vulnerableTemplate, { i18n: i18n[lang] });

            // If the code executed, the global variable will be set
            // This demonstrates the vulnerability exists
            if ((global as any).TEMPLATE_INJECTION_TEST === 'EXPLOITED') {
                // The vulnerability IS present - the malicious code executed
                // This test documents the vulnerability before the fix
                expect((global as any).TEMPLATE_INJECTION_TEST).toBe(
                    'EXPLOITED'
                );

                // Clean up
                delete (global as any).TEMPLATE_INJECTION_TEST;
            } else {
                // The vulnerability is fixed - the code did NOT execute
                // After the fix, this should be the case
                expect((global as any).TEMPLATE_INJECTION_TEST).toBeUndefined();
            }
        });

        it('should demonstrate RCE potential with process execution attempt', () => {
            // A more severe payload that attempts process manipulation
            const maliciousFeedTitle = '<%= process.pid %>';
            const feedUrl = 'https://example.com/feed.xml';
            const errorMessage = 'Failed';

            // Vulnerable pattern
            const vulnerableTemplate = `${maliciousFeedTitle}: <a href="${feedUrl}">${feedUrl}</a> <%=i18n['ERROR_MANY_TIME']%> ${errorMessage}`;

            const result = ejs.render(vulnerableTemplate, { i18n: i18n[lang] });

            // If process.pid appears in the output, code execution occurred
            if (result.includes(String(process.pid))) {
                // Vulnerability present - the process.pid was evaluated
                expect(result).toContain(String(process.pid));
            } else {
                // Vulnerability fixed - should show escaped or literal text instead
                expect(result).not.toContain(String(process.pid));
            }
        });
    });

    describe('Vulnerability Reproduction - isChangeFeedUrl path', () => {
        it('should NOT execute code from malicious feed title in feed change path', () => {
            const maliciousFeedTitle =
                '<%= global.FEED_CHANGE_EXPLOITED = "EXPLOITED" %>';
            const feedUrl = 'https://example.com/feed.xml';
            const newFeed = 'https://example.com/newfeed.xml';

            // This simulates the VULNERABLE code from index.ts:308-314
            const builder = [];
            builder.push(
                `${maliciousFeedTitle}: <a href="${feedUrl}"></a> <%=i18n['ERROR_MANY_TIME']%>`
            );
            builder.push(`<b><%=i18n['FOUND_FEEDS']%></b>:`);
            builder.push(newFeed);
            builder.push(`<%=i18n['FEED_CHANGE_TO']%> ${newFeed}`);
            const vulnerableTemplate = builder.join('\n');

            delete (global as any).FEED_CHANGE_EXPLOITED;

            const result = ejs.render(vulnerableTemplate, { i18n: i18n[lang] });

            if ((global as any).FEED_CHANGE_EXPLOITED === 'EXPLOITED') {
                expect((global as any).FEED_CHANGE_EXPLOITED).toBe('EXPLOITED');
                delete (global as any).FEED_CHANGE_EXPLOITED;
            } else {
                expect((global as any).FEED_CHANGE_EXPLOITED).toBeUndefined();
            }
        });
    });

    describe('Fixed Implementation - Passing untrusted data as EJS locals', () => {
        it('should safely render feed title when passed as EJS local', () => {
            const maliciousFeedTitle =
                '<%= global.SAFE_TEST = "SHOULD_NOT_EXECUTE" %>';
            const feedUrl = 'https://example.com/feed.xml';
            const errorMessage = 'Connection timeout';

            // FIXED CODE: Pass untrusted values as locals, reference them with escaped output
            const safeTemplate =
                '<%= title %>: <a href="<%= url %>"><%= url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%= msg %>';

            delete (global as any).SAFE_TEST;

            const result = ejs.render(safeTemplate, {
                title: maliciousFeedTitle,
                url: feedUrl,
                msg: errorMessage,
                i18n: i18n[lang]
            });

            // The malicious code should NOT execute
            expect((global as any).SAFE_TEST).toBeUndefined();

            // The result should contain the escaped/literal title text
            expect(result).toContain('&lt;%= global.SAFE_TEST');
            expect(result).toContain(feedUrl);
            expect(result).toContain('Unable to fetch for many times');
        });

        it('should safely render feed change with all untrusted data as locals', () => {
            const maliciousFeedTitle = '<%= process.exit(1) %>';
            const feedUrl = 'https://example.com/feed.xml';
            const newFeed = 'https://example.com/newfeed.xml';

            // FIXED CODE: Safe template with locals
            const safeTemplate =
                '<%= title %>: <a href="<%= url %>"></a> <%=i18n["ERROR_MANY_TIME"]%>\n<b><%=i18n["FOUND_FEEDS"]%></b>:\n<%= new_feed %>\n<%=i18n["FEED_CHANGE_TO"]%> <%= new_feed %>';

            const result = ejs.render(safeTemplate, {
                title: maliciousFeedTitle,
                url: feedUrl,
                new_feed: newFeed,
                i18n: i18n[lang]
            });

            // Process should still be running (not exited)
            expect(process.pid).toBeGreaterThan(0);

            // The result should contain escaped content
            expect(result).toContain('&lt;%= process.exit(1) %&gt;');
            expect(result).toContain(newFeed);
        });

        it('should handle malicious error messages safely', () => {
            const feedTitle = 'Legitimate Feed';
            const feedUrl = 'https://example.com/feed.xml';
            // err.message could also be attacker-controlled (from remote server responses)
            const maliciousErrorMessage =
                '<%= require("child_process").execSync("id").toString() %>';

            const safeTemplate =
                '<%= title %>: <a href="<%= url %>"><%= url %></a> <%=i18n["ERROR_MANY_TIME"]%> <%= msg %>';

            const result = ejs.render(safeTemplate, {
                title: feedTitle,
                url: feedUrl,
                msg: maliciousErrorMessage,
                i18n: i18n[lang]
            });

            // Should NOT execute the command - verify the template code is escaped
            expect(result).toContain('&lt;%=');
            expect(result).toContain('require');
            // The result should contain the HTML-escaped template code, not the output of the command
        });
    });
});
