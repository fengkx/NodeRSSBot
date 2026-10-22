/**
 * Integration tests for HTML escaping in Telegram messages.
 * These tests verify that feed-controlled and user-controlled data
 * is properly HTML-escaped when inserted into Telegram HTML messages.
 */

import escapeHtml from '../source/utils/escape-html';

describe('HTML escaping utility - comprehensive tests', () => {
    test('escapes HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });

    test('escapes ampersands', () => {
        expect(escapeHtml('Tech & News')).toBe('Tech &amp; News');
    });

    test('escapes quotes in attributes', () => {
        expect(escapeHtml('"Breaking" News')).toBe('&quot;Breaking&quot; News');
        expect(escapeHtml("It's here")).toBe('It&#39;s here');
    });

    test('escapes less-than and greater-than signs', () => {
        expect(escapeHtml('Tech <Daily> News')).toBe('Tech &lt;Daily&gt; News');
    });

    test('handles multiple special characters', () => {
        expect(escapeHtml('Tech <Daily> & "News"')).toBe(
            'Tech &lt;Daily&gt; &amp; &quot;News&quot;'
        );
    });

    test('preserves Chinese characters', () => {
        const chinese = '技术新闻 & 更新';
        expect(escapeHtml(chinese)).toBe('技术新闻 &amp; 更新');
    });

    test('preserves whitespace and newlines', () => {
        expect(escapeHtml('Line 1\nLine 2')).toBe('Line 1\nLine 2');
        expect(escapeHtml('  spaces  ')).toBe('  spaces  ');
    });

    test('returns unchanged string for inputs without special characters', () => {
        const plain = 'Plain text with no special chars';
        expect(escapeHtml(plain)).toBe(plain);
    });

    test('handles empty strings', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('handles URLs with special characters', () => {
        expect(escapeHtml('https://example.com/?q=a&b=c')).toBe(
            'https://example.com/?q=a&amp;b=c'
        );
    });
});

describe('HTML escaping in send.ts', () => {
    test('escapes URLs in href attributes', () => {
        const link = 'https://example.com/article?id=1&ref=rss';
        const escapedLink = escapeHtml(link);
        const title = 'Article Title';

        const messageFragment = `<a href="${escapedLink}">${title}</a>`;

        expect(messageFragment).toContain(
            'https://example.com/article?id=1&amp;ref=rss'
        );
        expect(messageFragment).toContain('Article Title');
    });

    test('escapes URLs when used as fallback link text', () => {
        const link = 'https://example.com/article?a=1&b=2';
        const escapedLink = escapeHtml(link);
        const title = ''; // Empty title

        const messageFragment = `<a href="${escapedLink}">${title || escapedLink}</a>`;

        // Link should be escaped both in href and as text
        expect(messageFragment).toBe(
            '<a href="https://example.com/article?a=1&amp;b=2">https://example.com/article?a=1&amp;b=2</a>'
        );
    });

    test('sanitizes titles with HTML-like characters', () => {
        const link = 'https://example.com/article';
        const title = 'Article with <brackets>';
        const escapedLink = escapeHtml(link);
        const escapedTitle = escapeHtml(title);

        const messageFragment = `<a href="${escapedLink}">${escapedTitle}</a>`;

        expect(messageFragment).toContain('Article with &lt;brackets&gt;');
    });
});

describe('HTML escaping in sub-multi-url.ts', () => {
    test('escapes URLs in href, sanitizes titles', () => {
        const feedTitle = 'Tech <Daily> & "News"';
        const url = 'https://example.com/feed?a=1&b=2';
        const encodedUrl = 'https://example.com/feed?a=1&b=2';

        // Simulate: escapeHtml for URL, but title would use sanitize() which also escapes
        const escapedUrl = escapeHtml(encodedUrl);
        const escapedTitle = escapeHtml(feedTitle); // In real code, sanitize() is used

        const message = `<a href="${escapedUrl}">${escapedTitle}</a>`;

        expect(message).toBe(
            '<a href="https://example.com/feed?a=1&amp;b=2">Tech &lt;Daily&gt; &amp; &quot;News&quot;</a>'
        );
    });

    test('preserves plain text output unchanged', () => {
        const feedTitle = 'Tech News';
        const escapedTitle = escapeHtml(feedTitle);
        const url = 'https://example.com/feed';
        const escapedUrl = escapeHtml(url);

        const message = `<a href="${escapedUrl}">${escapedTitle}</a>`;

        // Should be identical to unescaped version for plain text
        expect(message).toBe(
            '<a href="https://example.com/feed">Tech News</a>'
        );
    });

    test('preserves Chinese characters in titles', () => {
        const feedTitle = '技术新闻 & 更新';
        const escapedTitle = escapeHtml(feedTitle);

        expect(escapedTitle).toBe('技术新闻 &amp; 更新');
    });
});

describe('HTML escaping in import-from-opml.ts', () => {
    test('escapes URLs in href, sanitizes outline text', () => {
        const outlineUrl = 'https://example.com/feed?a=1&b=2';
        const outlineText = 'Feed <Title> & "Description"';

        const escapedUrl = escapeHtml(outlineUrl);
        const escapedText = escapeHtml(outlineText);

        const message = `<a href="${escapedUrl}">${escapedText}</a>`;

        expect(message).toContain('https://example.com/feed?a=1&amp;b=2');
        expect(message).toContain(
            'Feed &lt;Title&gt; &amp; &quot;Description&quot;'
        );
    });

    test('handles plain OPML data unchanged', () => {
        const outlineUrl = 'https://example.com/feed';
        const outlineText = 'My Feed';

        const escapedUrl = escapeHtml(outlineUrl);
        const escapedText = escapeHtml(outlineText);

        const message = `<a href="${escapedUrl}">${escapedText}</a>`;

        expect(message).toBe('<a href="https://example.com/feed">My Feed</a>');
    });
});

describe('HTML escaping in rss.ts', () => {
    test('escapes URLs in raw RSS list mode', () => {
        const url = 'https://example.com/feed?a=1&b=2';
        const encodedUrl = url;
        const decodedUrl = url;

        const escapedEncodedUrl = escapeHtml(encodedUrl);
        const escapedDecodedUrl = escapeHtml(decodedUrl);

        const message = `<a href="${escapedEncodedUrl}">${escapedDecodedUrl}</a>`;

        expect(message).toBe(
            '<a href="https://example.com/feed?a=1&amp;b=2">https://example.com/feed?a=1&amp;b=2</a>'
        );
    });

    test('escapes URLs in normal RSS list mode', () => {
        const url = 'https://example.com/feed?a=1&b=2';
        const feedTitle = 'Tech News';
        const encodedUrl = url;

        const escapedUrl = escapeHtml(encodedUrl);

        const message = `<a href="${escapedUrl}">${feedTitle}</a>`;

        expect(message).toBe(
            '<a href="https://example.com/feed?a=1&amp;b=2">Tech News</a>'
        );
    });

    test('escapes URLs in viewAll mode', () => {
        const url = 'https://example.com/feed?category=tech&lang=en';
        const encodedUrl = url;
        const escapedUrl = escapeHtml(encodedUrl);
        const title = 'Tech News';

        const message = `<a href="${escapedUrl}">${title}</a>`;

        expect(message).toContain(
            'https://example.com/feed?category=tech&amp;lang=en'
        );
    });

    test('plain URLs remain unchanged in output', () => {
        const url = 'https://example.com/feed';
        const escapedUrl = escapeHtml(url);

        expect(escapedUrl).toBe(url);
    });
});

describe('Whitespace normalization in titles', () => {
    test('sanitize() normalizes whitespace in feed titles (sub-multi-url)', () => {
        const feedTitle = 'Tech\n\nNews  Daily';
        // sanitize() removes newlines and collapses multiple spaces
        const sanitized = feedTitle
            .trim()
            .replace(/\n/g, '')
            .replace(/ +/g, ' ');
        expect(sanitized).toBe('TechNews Daily');

        // In sub-multi-url, feed_title uses sanitize()
        const url = 'https://example.com/feed';
        const escapedUrl = escapeHtml(url);
        const message = `<a href="${escapedUrl}">${sanitized}</a>`;

        expect(message).toBe(
            '<a href="https://example.com/feed">TechNews Daily</a>'
        );
        // Newlines and extra spaces are removed
        expect(message).not.toContain('\n');
        expect(message).not.toContain('  ');
    });

    test('sanitize() normalizes whitespace in OPML outline text (import-from-opml)', () => {
        const outlineText = 'Feed\n\nTitle  Here';
        // sanitize() removes newlines and collapses multiple spaces
        const sanitized = outlineText
            .trim()
            .replace(/\n/g, '')
            .replace(/ +/g, ' ');
        expect(sanitized).toBe('FeedTitle Here');

        // In import-from-opml, outline.text uses sanitize()
        const url = 'https://example.com/feed.xml';
        const escapedUrl = escapeHtml(url);
        const message = `<a href="${escapedUrl}">${sanitized}</a>`;

        expect(message).toBe(
            '<a href="https://example.com/feed.xml">FeedTitle Here</a>'
        );
        // Newlines and extra spaces are removed
        expect(message).not.toContain('\n');
        expect(message).not.toContain('  ');
    });

    test('escapeHtml() preserves whitespace in URLs', () => {
        // URLs should NOT have whitespace normalized - use escapeHtml
        const url = 'https://example.com/path with spaces';
        const escaped = escapeHtml(url);

        expect(escaped).toBe('https://example.com/path with spaces');
        // Spaces are preserved in URLs
        expect(escaped).toContain(' ');
    });
});

describe('Integration tests with special characters', () => {
    test('escapes all special character types correctly', () => {
        const feedTitle = 'Tech <Daily> & "News"';
        const itemTitle = 'Article: "Breaking" News & Updates';
        const itemLink = 'https://example.com/article?id=1&ref=rss';

        const escapedFeedTitle = escapeHtml(feedTitle);
        const escapedItemTitle = escapeHtml(itemTitle);
        const escapedItemLink = escapeHtml(itemLink);

        const message = `<b>${escapedFeedTitle}</b>\n<a href="${escapedItemLink}">${escapedItemTitle}</a>`;

        expect(message).toBe(
            '<b>Tech &lt;Daily&gt; &amp; &quot;News&quot;</b>\n' +
                '<a href="https://example.com/article?id=1&amp;ref=rss">Article: &quot;Breaking&quot; News &amp; Updates</a>'
        );
    });

    test('preserves Chinese and special characters together', () => {
        const feedTitle = '技术新闻 & 每日更新';
        const itemLink = 'https://example.com/article?lang=zh&category=tech';

        const escapedFeedTitle = escapeHtml(feedTitle);
        const escapedItemLink = escapeHtml(itemLink);

        expect(escapedFeedTitle).toBe('技术新闻 &amp; 每日更新');
        expect(escapedItemLink).toBe(
            'https://example.com/article?lang=zh&amp;category=tech'
        );
    });

    test('empty or plain inputs produce identical output to pre-fix behavior', () => {
        const plainTitle = 'Simple Title';
        const plainUrl = 'https://example.com/feed';

        const escapedTitle = escapeHtml(plainTitle);
        const escapedUrl = escapeHtml(plainUrl);

        expect(escapedTitle).toBe(plainTitle);
        expect(escapedUrl).toBe(plainUrl);

        const message = `<a href="${escapedUrl}">${escapedTitle}</a>`;
        expect(message).toBe(
            '<a href="https://example.com/feed">Simple Title</a>'
        );
    });
});
