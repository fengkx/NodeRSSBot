import escapeHtml from '../source/utils/escape-html';

describe('escapeHtml utility', () => {
    describe('escapes HTML special characters', () => {
        test('escapes ampersand', () => {
            expect(escapeHtml('a & b')).toBe('a &amp; b');
        });

        test('escapes less-than', () => {
            expect(escapeHtml('a < b')).toBe('a &lt; b');
        });

        test('escapes greater-than', () => {
            expect(escapeHtml('a > b')).toBe('a &gt; b');
        });

        test('escapes double quotes', () => {
            expect(escapeHtml('"quote"')).toBe('&quot;quote&quot;');
        });

        test('escapes single quotes', () => {
            expect(escapeHtml("it's")).toBe('it&#39;s');
        });

        test('escapes all special characters together', () => {
            expect(escapeHtml('Tech <Daily> & "News"')).toBe(
                'Tech &lt;Daily&gt; &amp; &quot;News&quot;'
            );
        });
    });

    describe('preserves whitespace and formatting', () => {
        test('preserves whitespace', () => {
            expect(escapeHtml('  spaces  ')).toBe('  spaces  ');
            expect(escapeHtml('\n\n')).toBe('\n\n');
            expect(escapeHtml('a\nb\nc')).toBe('a\nb\nc');
        });

        test('preserves Chinese characters', () => {
            expect(escapeHtml('技术新闻')).toBe('技术新闻');
            expect(escapeHtml('技术 & 新闻')).toBe('技术 &amp; 新闻');
        });
    });

    describe('edge cases', () => {
        test('handles empty string', () => {
            expect(escapeHtml('')).toBe('');
        });

        test('handles string without special characters', () => {
            const plain = 'Plain text 123';
            expect(escapeHtml(plain)).toBe(plain);
        });

        test('handles URLs with query parameters', () => {
            expect(escapeHtml('https://example.com/?a=1&b=2')).toBe(
                'https://example.com/?a=1&amp;b=2'
            );
        });

        test('handles HTML-like strings', () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
            );
        });
    });
});
