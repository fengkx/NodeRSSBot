const got = require('../utils/got');
const Parser = require('xml2js').Parser;
const errors = require('../utils/errors');
const RSS = require('../proxies/rss-feed');
const i18n = require('../i18n');

function parseOutlines(outlines, lst) {
    outlines.forEach((outline) => {
        if (outline.$.type && outline.$.type === 'rss') lst.push(outline.$);
        else if (outline.outline) parseOutlines(outline.outline, lst);
    });
}

const getOutlines = function(data) {
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

exports._getOutlines = getOutlines;
exports.default = async (ctx, next) => {
    const { fileLink, lang } = ctx.state;

    try {
        const res = await got.get(fileLink);
        const opmlStr = res.body;
        const outlines = await getOutlines(opmlStr);
        ctx.state.outlines = outlines;
        await Promise.all(
            outlines.map(async (outline) => {
                try {
                    await RSS.sub(
                        ctx.state.chat.id,
                        outline.xmlUrl,
                        outline.text
                    );
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
