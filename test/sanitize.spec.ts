import sanitize from '../source/utils/sanitize';

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
