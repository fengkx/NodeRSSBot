import sanitize, { stripEjsDelimiters } from '../source/utils/sanitize';

test('escape html character', () => {
    const cs = '<>';
    expect(sanitize(cs)).toEqual('&lt;&gt;');
});

test('escape all new line', () => {
    const cs = 'a\n\n\n\n\nb';
    expect(sanitize(cs)).toEqual('ab');
});

test('escape multi space', () => {
    const cs = 'a\n\n\n\n\n   b';
    expect(sanitize(cs)).toEqual('a b');
});

describe('stripEjsDelimiters', () => {
    test('should strip EJS opening delimiter', () => {
        const input = '<% code %>';
        expect(stripEjsDelimiters(input)).toBe('&lt;% code %&gt;');
    });

    test('should strip EJS output delimiter', () => {
        const input = '<%= value %>';
        expect(stripEjsDelimiters(input)).toBe('&lt;%= value %&gt;');
    });

    test('should strip EJS unescaped output delimiter', () => {
        const input = '<%- value %>';
        expect(stripEjsDelimiters(input)).toBe('&lt;%- value %&gt;');
    });

    test('should strip multiple EJS delimiters', () => {
        const input = 'Title <%= process.exit(1) %> and <%= "more" %>';
        expect(stripEjsDelimiters(input)).toBe(
            'Title &lt;%= process.exit(1) %&gt; and &lt;%= "more" %&gt;'
        );
    });

    test('should handle text without EJS delimiters', () => {
        const input = 'Normal feed title';
        expect(stripEjsDelimiters(input)).toBe('Normal feed title');
    });

    test('should prevent RCE payload', () => {
        const rcePayload =
            '<%= require("child_process").execSync("malicious").toString() %>';
        const result = stripEjsDelimiters(rcePayload);
        expect(result).toBe(
            '&lt;%= require("child_process").execSync("malicious").toString() %&gt;'
        );
    });
});
