import { findFeed } from '../source/utils/feed';

describe('Feed Discovery - findFeed()', () => {
    it('should decode HTML entities in href attributes', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/rss?a=1&amp;b=2&amp;c=3" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/');

        expect(feeds).toHaveLength(1);
        // Should be decoded: &amp; -> &
        expect(feeds[0]).toBe('https://example.com/rss?a=1&b=2&c=3');
    });

    it('should decode multiple types of entities', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/rss?x=&lt;value&gt;&amp;y=&quot;test&quot;" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/');

        expect(feeds).toHaveLength(1);
        // Entities are decoded, then URL constructor normalizes/encodes special chars
        expect(feeds[0]).toBe(
            'https://example.com/rss?x=%3Cvalue%3E&y=%22test%22'
        );
    });

    it('should decode numeric entities', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/rss?a=1&#38;b=2" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/');

        expect(feeds).toHaveLength(1);
        expect(feeds[0]).toBe('https://example.com/rss?a=1&b=2');
    });

    it('should decode hex entities', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/rss?a=1&#x26;b=2" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/');

        expect(feeds).toHaveLength(1);
        expect(feeds[0]).toBe('https://example.com/rss?a=1&b=2');
    });

    it('should handle multiple feeds with entities', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/rss1?a=1&amp;b=2" />
                    <link rel="alternate" type="application/atom+xml" href="https://example.com/atom?x=1&amp;y=2&amp;z=3" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/');

        expect(feeds).toHaveLength(2);
        expect(feeds[0]).toBe('https://example.com/rss1?a=1&b=2');
        expect(feeds[1]).toBe('https://example.com/atom?x=1&y=2&z=3');
    });

    it('should leave plain URLs unchanged', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/feed.xml" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/');

        expect(feeds).toHaveLength(1);
        expect(feeds[0]).toBe('https://example.com/feed.xml');
    });

    it('should handle absolute path URLs with entities', async () => {
        const html = `
            <html>
                <head>
                    <link rel="alternate" type="application/rss+xml" href="https://example.com/rss?a=1&amp;b=2" />
                </head>
            </html>
        `;

        const feeds = await findFeed(html, 'https://example.com/page');

        expect(feeds).toHaveLength(1);
        expect(feeds[0]).toBe('https://example.com/rss?a=1&b=2');
    });
});
