import { Outline, XmlOutline } from '../types/outline';
import got from '../utils/got';
import { Parser } from 'xml2js';
import errors from '../utils/errors';
import { sub } from '../proxies/rss-feed';
import i18n from '../i18n';
import { MContext, Next } from '../types/ctx';
function parseOutlines(outlines: XmlOutline[], lst: Outline[]) {
    outlines.forEach((outline) => {
        if (outline.$?.type === 'rss') lst.push(outline.$);
        else if (outline.outline) parseOutlines(outline.outline, lst);
    });
}

const getOutlines = async function (data: string): Promise<Outline[]> {
    const parser = new Parser();
    const res = await parser.parseStringPromise(data);
    const { opml } = res;
    const ret: Outline[] = [];
    parseOutlines(opml.body[0].outline, ret);
    return ret;
};

// eslint-disable-line
export const _getOutlines = getOutlines;
export default async (ctx: MContext, next: Next) => {
    const { fileLink, lang } = ctx.state;

    try {
        const res = await got.get(fileLink);
        const opmlStr = res.body;
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
