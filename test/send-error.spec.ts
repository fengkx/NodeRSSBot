/* eslint @typescript-eslint/no-empty-function:0 */
/* eslint no-empty-function:0 */
import errors from '../source/utils/errors';
import twoKeyReply from '../source/utils/two-key-reply';
import i18n from '../source/i18n';
import sendError from '../source/middlewares/send-error';
import userAllowList from '../source/middlewares/user_allow_list';
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
    await userAllowList(ctx, next); // init lang
    await sendError(ctx as unknown as MContext, next);
    expect(ctx).toHaveProperty('state.processMsgId', 233);
    expect(ctx).toHaveProperty('state.lang', 'en');
});

test('edits the processing reply in the command chat on error', async () => {
    const ctx = {
        chat: { id: 123 },
        state: { lang: 'en', chat: { id: -456 } },
        reply: jest.fn().mockResolvedValue({ message_id: 7 }),
        telegram: { editMessageText: jest.fn() }
    };
    await sendError(ctx as unknown as MContext, () => {
        throw errors.newCtrlErr('CHANNEL_ADMIN_REQUIRE');
    });
    expect(ctx.reply).toHaveBeenCalledTimes(1);
    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
        123,
        7,
        undefined,
        i18n.en.CHANNEL_ADMIN_REQUIRE,
        undefined
    );
});

test('pagination edits the existing list and acknowledges the button', async () => {
    const ctx = {
        chat: { id: 123 },
        state: { lang: 'en' },
        callbackQuery: { message: { message_id: 8 } },
        reply: jest.fn(),
        answerCbQuery: jest.fn(),
        telegram: { editMessageText: jest.fn() }
    };
    const context = ctx as unknown as MContext;
    const buttons = [{ text: 'Back', callback_data: 'RSS_1' }];
    await sendError(context, () =>
        twoKeyReply(buttons, 'Page 2')(context, jest.fn())
    );
    expect(ctx.reply).not.toHaveBeenCalled();
    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
        123,
        8,
        undefined,
        'Page 2',
        expect.objectContaining({
            reply_markup: { inline_keyboard: [buttons] }
        })
    );
    expect(ctx.answerCbQuery).toHaveBeenCalledTimes(1);
});
