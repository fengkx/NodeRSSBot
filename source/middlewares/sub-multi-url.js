const errors = require('../utils/errors');
const got = require('../utils/got');
const Parser = require('rss-parser');
const RSS = require('../proxies/rss-feed');
const i18n = require('../i18n');

module.exports = async (ctx, next) => {
    const urls = ctx.message.text.match(
        /(((https?:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/gm
    );
    const { lang } = ctx.state;
    const feedsReady = await Promise.all(
        urls.map(async (url) => {
            url = decodeURI(url);
            const feed = await RSS.getFeedByUrl(url);
            if (feed) {
                return feed;
            } else {
                try {
                    const parser = new Parser();
                    const res = await got.get(encodeURI(url));
                    const rssFeed = await parser.parseString(res.body);
                    return {
                        feed_title: rssFeed.title,
                        url
                    };
                } catch (e) {
                    ctx.reply(`${url} ${i18n[lang]['FETCH_ERROR']}`);
                }
            }
        })
    );

    let builder = [i18n[lang]['SUB_SUCCESS']];
    feedsReady
        .filter((i) => i)
        .forEach(function(feed) {
            try {
                RSS.sub(ctx.state.chat.id, feed.url, feed.feed_title);
            } catch (e) {
                if (e.message !== 'ALREADY_SUB')
                    throw errors.newCtrlErr('DB_ERROR');
            }
            builder.push(`<a href="${feed.url}">${feed.feed_title}</a>`);
        });
    if (builder.length > 1) {
        // some feed did sub successfully
        ctx.replyWithHTML(builder.join('\n'));
    }
    await next();
};
