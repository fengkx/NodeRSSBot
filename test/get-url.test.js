/* eslint no-empty-function:0 */
const getUrl = require('../middlewares/get-url');
const ErrClass = require('../utils/errors').ControllableError;

jest.mock('../proxies/rss-feed', () => ({
    // eslint-disable-next-line no-unused-vars
    getSubscribedFeedsByUserId: async (id) => {
        return require('./test-data/feeds');
    }
}));

test('get-url@only_sub', async () => {
    const ctx = require('./test-data/ctx/get-url-ctx')('/sub');
    await expect(getUrl(ctx, () => {})).rejects.toThrow(ErrClass);
});

test('get-url@only_unsub', async () => {
    const ctx = require('./test-data/ctx/get-url-ctx')('/unsub');
    await expect(getUrl(ctx, () => {})).resolves.not.toThrow();
});

test('get-url@sub_with_url', async () => {
    const url = 'https://www.fengkx.top/atom.xml';
    const ctx = require('./test-data/ctx/get-url-ctx')(`/sub ${url}`);
    await expect(getUrl(ctx, () => {}));
    expect(ctx).toHaveProperty('state.feedUrl', url);
});

test('get-url@sub_with_url_need_escape', async () => {
    const url = 'https://www.fengkx.top/测试.xml';
    const ctx = require('./test-data/ctx/get-url-ctx')(`/sub ${url}`);
    await expect(getUrl(ctx, () => {}));
    expect(ctx).toHaveProperty('state.feedUrl', url);
});
