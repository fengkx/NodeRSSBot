import { Outline } from '../types/outline';
import got from '../utils/got';
import { transform } from 'camaro';
import errors from '../utils/errors';
import { sub } from '../proxies/rss-feed';
import i18n from '../i18n';
import { MContext, TNextFn } from '../types/ctx';

const getOutlines = async function (data: string): Promise<Outline[]> {
    return await transform(data, [
        '//outline[@type="rss"]',
        {
            xmlUrl: '@xmlUrl',
            type: '@type',
            text: '@text'
        }
    ]);
};

// eslint-disable-line
export const _getOutlines = getOutlines;
export default async (ctx: MContext, next: TNextFn): Promise<void> => {
    const { fileLink, lang } = ctx.state;

    try {
        const res = await got(fileLink);
        const opmlStr = await res.textConverted();
        const outlines = await getOutlines(opmlStr);
        ctx.state.outlines = outlines;
        await Promise.all(
            outlines.map(async (outline) => {
                try {
                    await sub(ctx.state.chat.id, outline.xmlUrl, outline.text);
                } catch (e) {
                    if (e.code !== 'ALREADY_SUB')
                        // ignore feed already sub
                        throw errors.newCtrlErr('DB_ERROR', e);
                }
            })
        );
        let text = `<strong>${i18n[lang]['IMPORT_SUCCESS']}</strong>`;
        outlines.forEach((outline) => {
            text += `\n<a href="${outline.xmlUrl}">${outline.text}</a>`;
        });
        if (text.length > 4096) {
            text = `<strong>${i18n[lang]['IMPORT_SUCCESS']}</strong>\n`;
        }
        ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMsgId);
        ctx.state.processMsgId = null;
        ctx.replyWithHTML(text);
    } catch (e) {
        if (e.response) {
            throw errors.newCtrlErr('NETWORK_ERROR', e);
        } else if (e instanceof errors.ControllableError) {
            throw e;
        } else {
            throw errors.newCtrlErr('OPML_PARSE_ERRO', e);
        }
    }
    await next();
};
