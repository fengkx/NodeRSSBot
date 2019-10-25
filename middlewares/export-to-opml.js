const RSS = require('../proxies/rss-feed');
const errors = require('../utils/errors');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

function readFilePromise(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(
            path,
            {
                encoding: 'utf8'
            },
            function(err, data) {
                if (err) reject(err);
                resolve(data);
            }
        );
    });
}

const render = async (outlines) => {
    const tpl = await readFilePromise(
        path.join(__dirname, '../template/opml.ejs')
    );
    // console.log(tpl)
    return ejs.render(tpl, { outlines });
};

function remove(path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, function(err) {
            if (err) reject(err);
            resolve();
        });
    });
}

module.exports = async (ctx, next) => {
    const chat = ctx.state.chat;
    const feeds = await RSS.getSubscribedFeedsByUserId(chat.id);
    if (feeds.length === 0) {
        throw errors.newCtrlErr('NOT_SUB');
    }
    const opml = await render(feeds);
    try {
        const filePath = path.join(__dirname, '../data/', chat.id.toString());
        fs.writeFileSync(filePath, opml);
        await ctx.replyWithDocument({
            source: fs.readFileSync(filePath),
            filename: 'export.opml'
        });
        await remove(filePath);
    } catch (e) {
        throw errors.newCtrlErr('FILESYSTEM_ERROR', e);
    }
    await next();
};
