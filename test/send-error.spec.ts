/* eslint @typescript-eslint/no-empty-function:0 */
/* eslint no-empty-function:0 */
import sendError from '../source/middlewares/send-error';
import { MContext } from '../source/types/ctx';
import { Optional } from '../source/types/option';
jest.mock('../source/proxies/users', () => ({
    getUserById: (id) => {
        const testUser = {
            user_id: 233233233,
            lang: 'en'
        };
        testUser.user_id = id;
        return Optional(testUser);
    }
}));

test('sendError@message', async () => {
    const ctx = require('./test-data/ctx/send-error-ctx').messageCtx; // reply with message_id 233
    const next = () => {};
    await sendError((ctx as unknown) as MContext, next);
    expect(ctx).toHaveProperty('state.processMsgId', 233);
    expect(ctx).toHaveProperty('state.lang', 'en');
});
