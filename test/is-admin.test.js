/* eslint no-empty-function:0 */
const isAdmin = require('../source/middlewares/is-admin');
const { pass, noAdmin } = require('./test-data/ctx/is-admin-ctx');
const ErrClass = require('../source/utils/errors').ControllableError;

jest.mock('../source/proxies/users', () => ({
    getUserById: (id) => {
        const testUser = {
            user_id: 233233233,
            lang: 'en'
        };
        testUser.user_id = id;
        return testUser;
    }
}));

test('sub channel with @', async () => {
    const channelId = 666;
    const ctx = pass('/sub @testChannel http://test.test', 666);
    await isAdmin(ctx, () => {});
    expect(ctx).toHaveProperty('state.chat.id', channelId);
    expect(ctx.message.text).not.toMatch(/@\w+/);
});

test('sub channel without @', async () => {
    const channelId = 666;
    const ctx = pass('/sub -123456 http://test.test', channelId);
    await isAdmin(ctx, () => {});
    expect(ctx).toHaveProperty('state.chat.id', channelId);
    expect(ctx.message.text).not.toMatch(/-\d+/);
});

test('bot no admin in channel', async () => {
    const channelId = 666;
    const ctx = noAdmin('/sub -123456 http://test.test', channelId);
    await expect(isAdmin(ctx, () => {})).rejects.toThrow(ErrClass);
});

test('url contain -', async () => {
    const channelId = 666;
    const ctx = pass(
        '/sub http://ip-243-184bpo123.com/kuaidi100/141abc',
        channelId
    );
    await isAdmin(ctx, () => {});
    expect(ctx).toHaveProperty('state.chat.id', 233233233);
});
