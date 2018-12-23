const axios = require('axios');
const Parser = require('xml2js').Parser;
const fs = require('fs');
const logger = require('../utils/logger');
const RSS = require('../proxies/rssFeed');
const i18n = require('../i18n');

const getOutlines = function (data) {
    return new Promise((resolve, reject) =>{
        const parser = new Parser();
        parser.parseString(data, function (err, res) {
            if(err) reject(err);
            const {opml} = res;
            const ret = [];
            opml.body[0].outline.forEach(function (item) {
                ret.push(item.$)
            });
            resolve(ret);
        })
    })
};



module.exports = async (ctx, next) => {
    const {fileLink} = ctx.state;

    try {
        const res = await axios.get(fileLink);
        const opmlStr = res.data;
        const outlines = await getOutlines(opmlStr);
        ctx.state.outlines = outlines;
        await Promise.all(outlines.map(async outline => {
            try {
                RSS.sub(ctx.chat.id, outline.xmlUrl, outline.text);
            } catch (e) {
                if(e.message !== 'ALREADY_SUB') throw new Error('DB_ERROR');
            }
        }));
        let text = `<strong>${i18n['IMPORT_SUCCESS']}</strong>`;
        outlines.forEach(outline => {
           text += `\n<a href="${outline.xmlUrl}">${outline.text}</a>`
        });
        ctx.telegram.deleteMessage(ctx.state.chat.id, ctx.state.processMesId);
        ctx.replyWithHTML(text);
    } catch (e) {
        logger.error(e);
        if(!!e.response) {
            throw new Error('NETWORK_ERROR');
        } else {
            throw new Error('OPML_PARSE_ERRO')
        }
    }
    await next();
};
