import { TelegramError } from 'telegraf';
import { MContext } from '../source/types/ctx';
import { Optional } from '../source/types/option';
import i18n from '../source/i18n';
import sendError, { processing } from '../source/middlewares/send-error';
import editResponse from '../source/utils/edit-response';
import exportToOpml from '../source/middlewares/export-to-opml';
import subMultiUrl from '../source/middlewares/sub-multi-url';
import testUrl from '../source/middlewares/test-url';
import { sub, unsub } from '../source/controlers/rss';
import { changeLangCallback } from '../source/controlers/language';
import * as RSS from '../source/proxies/rss-feed';
import got from '../source/utils/got';
import { isFeedValid } from '../source/utils/feed';

jest.mock('../source/proxies/rss-feed');
jest.mock('../source/proxies/users');
jest.mock('../source/utils/got');
jest.mock('../source/utils/feed');

const url = 'https://example.org/feed';
const badRequest = (description: string) =>
    new TelegramError({
        error_code: 400,
        description: 'Bad Request: ' + description
    });
const next = jest.fn();

function setup() {
    const ctx = {
        state: { chat: { id: 1 }, lang: 'en', processMsgId: 2, feedUrl: url },
        chat: { id: 1 },
        message: { text: url },
        telegram: { editMessageText: jest.fn(), editMessageMedia: jest.fn() },
        reply: jest.fn().mockResolvedValue({ message_id: 3 }),
        replyWithDocument: jest.fn().mockResolvedValue({ message_id: 4 }),
        replyWithHTML: jest.fn(),
        answerCbQuery: jest.fn()
    };
    return {
        ctx,
        context: ctx as unknown as MContext & { message: { text: string } }
    };
}

test.each(["message can't be edited", 'message to edit not found'])(
    'recovers a list after %s',
    async (description) => {
        const { ctx, context } = setup();
        const options = {
            parse_mode: 'HTML' as const,
            reply_markup: {
                inline_keyboard: [[{ text: 'Next', callback_data: 'RSS_2' }]]
            }
        };
        ctx.telegram.editMessageText.mockRejectedValueOnce(
            badRequest(description)
        );
        await editResponse(context, 'list', options);
        expect(ctx.reply).toHaveBeenCalledWith('list', options);
        await editResponse(context, 'next page');
        expect(ctx.telegram.editMessageText).toHaveBeenLastCalledWith(
            1,
            3,
            undefined,
            'next page',
            undefined
        );
    }
);

test('acknowledges a repeated page without sending another message', async () => {
    const { ctx, context } = setup();
    Object.assign(ctx, { callbackQuery: { message: { message_id: 5 } } });
    ctx.telegram.editMessageText.mockRejectedValueOnce(
        badRequest('message is not modified: unchanged')
    );
    await sendError(context, () => editResponse(context, 'page'));
    expect(ctx.answerCbQuery).toHaveBeenCalledWith();
    expect(ctx.reply).not.toHaveBeenCalled();
});

test('clears the picker when sending processing, then edits that response', async () => {
    const { ctx, context } = setup();
    await processing(context, () => editResponse(context, 'done'), {
        removeKeyboard: true
    });
    expect(ctx.reply).toHaveBeenCalledWith(i18n.en.PROCESSING, {
        reply_markup: { remove_keyboard: true }
    });
    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
        1,
        3,
        undefined,
        'done',
        undefined
    );
});

test.each(['MESSAGE_TOO_LONG', 'message is too long'])(
    'reports %s with a short localized response',
    async (description) => {
        const { ctx, context } = setup();
        ctx.telegram.editMessageText.mockRejectedValueOnce(
            badRequest(description)
        );
        await sendError(context, () => editResponse(context, 'x'.repeat(4097)));
        expect(ctx.reply).toHaveBeenCalledTimes(1);
        expect(ctx.telegram.editMessageText).toHaveBeenLastCalledWith(
            1,
            3,
            undefined,
            i18n.en.RESPONSE_TOO_LONG,
            undefined
        );
    }
);

describe('OPML export', () => {
    beforeEach(() => {
        jest.mocked(RSS.getSubscribedFeedsByUserId).mockResolvedValue([
            { feed_title: 'Example', url }
        ] as Awaited<ReturnType<typeof RSS.getSubscribedFeedsByUserId>>);
    });
    test('attaches the document to the processing message', async () => {
        const { ctx, context } = setup();
        await exportToOpml(context, next);
        const [chat, id, , media] = ctx.telegram.editMessageMedia.mock.calls[0];
        expect([chat, id, media.type, media.media.filename]).toEqual([
            1,
            2,
            'document',
            'export.opml'
        ]);
        expect(media.media.source.toString()).toContain(url);
        expect(ctx.replyWithDocument).not.toHaveBeenCalled();
    });
    test('sends the same file once and marks the old message complete after a rejection', async () => {
        const { ctx, context } = setup();
        ctx.telegram.editMessageMedia.mockRejectedValueOnce(
            badRequest('there is no media in the message to edit')
        );
        await exportToOpml(context, next);
        expect(ctx.replyWithDocument).toHaveBeenCalledTimes(1);
        expect(ctx.replyWithDocument).toHaveBeenCalledWith(
            ctx.telegram.editMessageMedia.mock.calls[0][3].media
        );
        expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
            1,
            2,
            undefined,
            i18n.en.EXPORT_SUCCESS
        );
    });
    test('does not resend a file after an ambiguous timeout', async () => {
        const { ctx, context } = setup();
        const timeout = new Error('timeout');
        ctx.telegram.editMessageMedia.mockRejectedValueOnce(timeout);
        await expect(exportToOpml(context, next)).rejects.toBe(timeout);
        expect(ctx.replyWithDocument).not.toHaveBeenCalled();
    });
});

test('reports an already removed subscription even when the feed exists', async () => {
    const { context } = setup();
    jest.mocked(RSS.getFeedByUrl).mockResolvedValue(
        Optional({ feed_id: 5 }) as Awaited<ReturnType<typeof RSS.getFeedByUrl>>
    );
    jest.mocked(RSS.unsub).mockResolvedValue(0);
    await expect(unsub(context, next)).rejects.toMatchObject({
        code: 'DID_NOT_SUB'
    });
});

test('acknowledges a language change without duplicating its confirmation', async () => {
    const { ctx, context } = setup();
    Object.assign(ctx, {
        callbackQuery: { data: 'CHANGE_LANG_en_1', message: { message_id: 9 } }
    });
    await sendError(context, () => changeLangCallback(context, next));
    expect(ctx.answerCbQuery).toHaveBeenCalledWith();
    expect(ctx.telegram.editMessageText).toHaveBeenCalledWith(
        1,
        9,
        undefined,
        i18n.en.SET_LANG_TO + ' en',
        undefined
    );
});

test('preserves a short feed title when its link target is long', async () => {
    const { ctx, context } = setup();
    context.state.feedUrl = url + '?q=' + 'x'.repeat(4060);
    context.state.feed = { feed_title: 'Complete feed title' };

    await sub(context, next);

    expect(ctx.telegram.editMessageText.mock.calls[0][3]).toContain(
        '>Complete feed title</a>'
    );
});

test('limits the visible confirmation before escaping a long feed title', async () => {
    const { ctx, context } = setup();
    context.state.feed = { feed_title: '<' + '👩‍💻'.repeat(2500) };
    await sub(context, next);
    const html = ctx.telegram.editMessageText.mock.calls[0][3];
    expect(html).toMatch(/&lt;(👩‍💻)+…<\/a>$/u);
    expect(
        html.replace(/<[^>]*>/g, '').replace('&lt;', '<').length
    ).toBeLessThanOrEqual(4096);
});

test('delivers both an oversized title and an oversized fetch error in a batch', async () => {
    const { ctx, context } = setup();
    ctx.message.text += '\nhttps://example.org/broken';
    jest.mocked(RSS.getFeedByUrl)
        .mockResolvedValueOnce(
            Optional({ feed_title: 'X'.repeat(5000), url }) as Awaited<
                ReturnType<typeof RSS.getFeedByUrl>
            >
        )
        .mockResolvedValueOnce(Optional(undefined));
    jest.mocked(got).mockRejectedValueOnce(new Error('<'.repeat(6000)));
    await subMultiUrl(context, next);
    const messages = [
        ctx.telegram.editMessageText.mock.calls[0][3],
        ...ctx.replyWithHTML.mock.calls.map(([html]) => html)
    ];
    expect(messages.join('\n')).toContain('…</a>');
    expect(messages.join('\n')).toContain('&lt;…');
    for (const html of messages)
        expect(
            html.replace(/<[^>]*>/g, '').replaceAll('&lt;', '<').length
        ).toBeLessThanOrEqual(4096);
});

test('preserves downstream errors after discovering a new feed', async () => {
    const { context } = setup();
    jest.mocked(RSS.getFeedByUrl).mockResolvedValueOnce(Optional(undefined));
    jest.mocked(got).mockResolvedValueOnce({
        url,
        textConverted: async () => 'feed'
    } as Awaited<ReturnType<typeof got>>);
    jest.mocked(isFeedValid).mockResolvedValueOnce(
        Optional({ title: 'Example' }) as Awaited<
            ReturnType<typeof isFeedValid>
        >
    );
    const error = new Error('Telegram timeout');
    await expect(
        testUrl(context, async () => {
            throw error;
        })
    ).rejects.toBe(error);
});
