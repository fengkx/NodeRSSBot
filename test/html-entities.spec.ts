import { decodeHtmlEntities } from '../source/utils/html-entities';

describe('HTML Entity Decoder', () => {
    it('should decode common named entities', () => {
        expect(decodeHtmlEntities('&amp;')).toBe('&');
        expect(decodeHtmlEntities('&lt;')).toBe('<');
        expect(decodeHtmlEntities('&gt;')).toBe('>');
        expect(decodeHtmlEntities('&quot;')).toBe('"');
        expect(decodeHtmlEntities('&apos;')).toBe("'");
    });

    it('should decode numeric entities (decimal)', () => {
        expect(decodeHtmlEntities('&#38;')).toBe('&');
        expect(decodeHtmlEntities('&#60;')).toBe('<');
        expect(decodeHtmlEntities('&#62;')).toBe('>');
    });

    it('should decode numeric entities (hexadecimal)', () => {
        expect(decodeHtmlEntities('&#x26;')).toBe('&');
        expect(decodeHtmlEntities('&#x3C;')).toBe('<');
        expect(decodeHtmlEntities('&#x3E;')).toBe('>');
        expect(decodeHtmlEntities('&#x22;')).toBe('"');
    });

    it('should decode multiple entities in a string', () => {
        expect(decodeHtmlEntities('a=1&amp;b=2&amp;c=3')).toBe('a=1&b=2&c=3');
        expect(decodeHtmlEntities('&lt;tag&gt;')).toBe('<tag>');
    });

    it('should handle URLs with entities', () => {
        const url = 'https://example.com/feed?a=1&amp;b=2&amp;c=3';
        expect(decodeHtmlEntities(url)).toBe(
            'https://example.com/feed?a=1&b=2&c=3'
        );
    });

    it('should leave plain text unchanged', () => {
        expect(decodeHtmlEntities('https://example.com/feed.xml')).toBe(
            'https://example.com/feed.xml'
        );
        expect(decodeHtmlEntities('Plain text')).toBe('Plain text');
    });

    it('should leave unrecognized entities unchanged', () => {
        expect(decodeHtmlEntities('&unknownentity;')).toBe('&unknownentity;');
    });
});
