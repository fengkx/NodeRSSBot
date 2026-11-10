import { badRequestDescription, cannotEdit } from '../utils/edit-response';
import i18n from '../i18n';
import { getSubscribedFeedsByUserId } from '../proxies/rss-feed';
import errors from '../utils/errors';
import * as path from 'path';
import * as ejs from 'ejs';
import * as fs from 'fs';
import { MContext, TNextFn } from '../types/ctx';
import { Feed } from '../types/feed';
import { escapeHTML } from 'fast-escape-html';

function readFilePromise(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(
            path,
            {
                encoding: 'utf8'
            },
            function (err, data) {
                if (err) reject(err);
                resolve(data);
            }
        );
    });
}

const opmlTemplatePath = path.join(__dirname, '../template/opml.ejs');
const templateCacheMap = new Map<string, ReturnType<typeof ejs.compile>>();
const render = async (feeds: Feed[]): Promise<string> => {
    if (!templateCacheMap.has(opmlTemplatePath)) {
        const tpl = await readFilePromise(opmlTemplatePath);
        templateCacheMap.set(opmlTemplatePath, ejs.compile(tpl));
    }
    const template = templateCacheMap.get(opmlTemplatePath);

    feeds.forEach((feed) => {
        feed.feed_title = escapeHTML(feed.feed_title);
        feed.url = escapeHTML(feed.url);
    });
    return template({ feeds });
};

/** Replace the still-visible processing message with a completion note. */
async function markProcessingMessageExported(
    ctx: MContext,
    messageId: number
): Promise<void> {
    try {
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            messageId,
            undefined,
            i18n[ctx.state.lang]['EXPORT_SUCCESS']
        );
    } catch (error) {
        if (!cannotEdit(badRequestDescription(error))) throw error;
    }
}

export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    const chat = ctx.state.chat;
    const feeds = await getSubscribedFeedsByUserId(chat.id);
    if (feeds.length === 0) {
        throw errors.newCtrlErr('NOT_SUB');
    }
    let opml: string;
    try {
        opml = await render(feeds);
    } catch (e) {
        throw errors.newCtrlErr('FILESYSTEM_ERROR', e);
    }
    const document = { source: Buffer.from(opml), filename: 'export.opml' };
    const messageId = ctx.state.processMsgId;
    try {
        await ctx.telegram.editMessageMedia(ctx.chat.id, messageId, undefined, {
            type: 'document',
            media: document
        });
    } catch (error) {
        // A timeout can arrive after delivery. Only resend after an explicit rejection.
        const description = badRequestDescription(error);
        if (!description) throw error;
        const sent = await ctx.replyWithDocument(document);
        ctx.state.processMsgId = sent.message_id;
        if (description !== 'message to edit not found') {
            await markProcessingMessageExported(ctx, messageId);
        }
    }
    await next();
};
