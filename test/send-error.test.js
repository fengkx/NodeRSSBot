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

const sendError = require('../middlewares/send-error');

test('sendError@message', async () => {
    const ctx = require('./test-data/ctx/send-error-ctx').messageCtx; // reply with message_id 233
    // eslint-disable-next-line no-empty-function
    const next = () => {};
    await sendError(ctx, next);
    expect(ctx).toHaveProperty('state.processMesId', 233);
    expect(ctx).toHaveProperty('state.lang', 'en');
});
