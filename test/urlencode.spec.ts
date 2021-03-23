import { encodeUrl, decodeUrl } from '../source/utils/urlencode';

test('decodeUrl completely', () => {
    expect(
        decodeUrl(
            'https://www.diigo.com/rss/profile/melissaadkins?query=%23myfav'
        )
    ).toBe('https://www.diigo.com/rss/profile/melissaadkins?query=#myfav');
    expect(
        decodeUrl(
            'https://www.example.org/url=http%3A%2F%2Fwww.example.com%2Ffeed%2F&max=20'
        )
    ).toBe('https://www.example.org/url=http://www.example.com/feed/&max=20');
});

test('encodeUrl', () => {
    const tests = new Map<string, string>();
    tests.set(
        'https://user:password@www.example.org',
        'https://user:password@www.example.org/'
    );
    tests.set(
        'https://www.example.org/path with spaces',
        'https://www.example.org/path%20with%20spaces'
    );
    tests.set(
        'https://www.example.org/path#test',
        'https://www.example.org/path'
    );
    // tests.set('https://www.example.org/path?abc#test', 'https://www.example.org/path?abc');
    tests.set(
        'https://www.example.org/url=http%3A%2F%2Fwww.example.com%2Ffeed%2F&max=20',
        'https://www.example.org/url=http%3A%2F%2Fwww.example.com%2Ffeed%2F&max=20'
    );
    tests.set(
        'https://www.example.org/url=http://www.example.com/feed/&max=20',
        'https://www.example.org/url=http://www.example.com/feed/&max=20'
    );
    tests.set(
        'https://www.example.org/path?测试=测试',
        'https://www.example.org/path?%E6%B5%8B%E8%AF%95=%E6%B5%8B%E8%AF%95'
    );
    tests.set(
        'https://www.example.org/path?a=b&a=c&d',
        'https://www.example.org/path?a=b&a=c&d'
    );
    tests.set(
        'https://www.example.org/path?atom',
        'https://www.example.org/path?atom'
    );
    tests.set(
        'https://www.diigo.com/rss/profile/melissaadkins?query=#myfav',
        'https://www.diigo.com/rss/profile/melissaadkins?query=%23myfav'
    );
    for (const [left, right] of tests.entries()) {
        expect(encodeUrl(left)).toBe(right);
    }
});
