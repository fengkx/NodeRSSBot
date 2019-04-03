const got = require('got');
const Parser = require('xml2js').Parser;
const logger = require('../utils/logger');
const RSS = require('../proxies/rssFeed');
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

module.exports = async (ctx, next) => {
    const { fileLink } = ctx.state;

    try {
        const res = await got.get(fileLink);
        const opmlStr = res.body;
        const outlines = await getOutlines(opmlStr);
        ctx.state.outlines = outlines;
        await Promise.all(
            outlines.map(async (outline) => {
                try {
                    await RSS.sub(ctx.chat.id, outline.xmlUrl, outline.text);
                } catch (e) {
                    if (e.message !== 'ALREADY_SUB')
                        throw new Error('DB_ERROR');
                }
            })
        );
        let text = `<strong>${i18n['IMPORT_SUCCESS']}</strong>`;
        outlines.forEach((outline) => {
            text += `\n<a href="${outline.xmlUrl}">${outline.text}</a>`;
        });
        ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
        ctx.state.processMesId = null;
        ctx.replyWithHTML(text);
    } catch (e) {
        logger.error(e);
        if (e.response) {
            throw new Error('NETWORK_ERROR');
        } else {
            throw new Error('OPML_PARSE_ERRO');
        }
    }
    await next();
};
