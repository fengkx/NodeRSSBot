/* eslint no-empty-function:0 */
const isAdmin = require('../middlewares/is-admin');
const { pass, noAdmin } = require('./test-data/ctx/is-admin-ctx');
const ErrClass = require('../utils/errors').ControllableError;

jest.mock('../proxies/users', () => ({
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
});

test('sub channel without @', async () => {
    const channelId = 666;
    const ctx = pass('/sub -123456 http://test.test', channelId);
    await isAdmin(ctx, () => {});
    expect(ctx).toHaveProperty('state.chat.id', channelId);
});

test('bot no admin in channel', async () => {
    const channelId = 666;
    const ctx = noAdmin('/sub -123456 http://test.test', channelId);
    await expect(isAdmin(ctx, () => {})).rejects.toThrow(ErrClass);
});
