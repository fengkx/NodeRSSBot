/* eslint no-empty-function:0 */
/* eslint @typescript-eslint/no-empty-function:0 */
import getUrl from '../source/middlewares/get-url';
import {ControllableError} from '../source/utils/errors';
import testFeeds from './test-data/feeds'
jest.mock('../source/proxies/rss-feed', () => ({
    // eslint-disable-next-line no-unused-vars
    getSubscribedFeedsByUserId: async () => {
        return testFeeds;
    }
}));

test('get-url@only_sub', async () => {
    const ctx = require('./test-data/ctx/get-url-ctx')('/sub');
    await expect(getUrl(ctx, () => {})).rejects.toThrow(ControllableError);
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
