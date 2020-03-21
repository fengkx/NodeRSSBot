import { Outline, XmlOutline } from '../types/outline';
import got from '../utils/got';
import { Parser } from 'xml2js';
import errors from '../utils/errors';
import { sub } from '../proxies/rss-feed';
import i18n from '../i18n';
function parseOutlines(outlines: XmlOutline[], lst: Outline[]) {
    outlines.forEach((outline) => {
        if (outline.$?.type === 'rss') lst.push(outline.$);
        else if (outline.outline) parseOutlines(outline.outline, lst);
    });
}

const getOutlines = function(data: string): Promise<Outline[]> {
    return new Promise((resolve, reject) => {
        const parser = new Parser();
        parser.parseString(data, function(err, res) {
            if (err) reject(err);
            const { opml } = res;
            const ret = [];
            parseOutlines(opml.body[0].outline, ret);
            resolve(ret);
        });
    });
};

// eslint-disable-line
export const _getOutlines = getOutlines;
export default async (ctx, next) => {
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
        ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
        ctx.state.processMesId = null;
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
