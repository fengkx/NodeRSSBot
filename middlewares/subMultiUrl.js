const axios = require('../utils/axios');
const Parser = require('rss-parser');
const RSS = require('../proxies/rssFeed');
const i18n = require('../i18n');

module.exports = async (ctx, next) => {
    const urls = ctx.message.text.match(/^http(s)?:\/\/\w+\.\w+.*(\w|\/)/gm);
    const feedsReady = await Promise.all(
        urls.map(async (url) => {
            url = decodeURI(url);
            const feed = await RSS.getFeedByUrl(url);
            if (feed) {
                return feed;
            } else {
                try {
                    const parser = new Parser();
                    const res = await axios.get(encodeURI(url));
                    const rssFeed = await parser.parseString(res.data);
                    return {
                        feed_title: rssFeed.title,
                        url
                    };
                } catch (e) {
                    ctx.reply(`${url} ${i18n['FETCH_ERROR']}`);
                }
            }
        })
    );

    let builder = [i18n['SUB_SUCCESS']];
    feedsReady
        .filter((i) => i)
        .forEach(function(feed) {
            try {
                RSS.sub(ctx.state.chat.id, feed.url, feed.feed_title);
            } catch (e) {
                if (e.message !== 'ALREADY_SUB') throw new Error('DB_ERROR');
            }
            builder.push(`<a href="${feed.url}">${feed.feed_title}</a>`);
        });
    ctx.replyWithHTML(builder.join('\n'));
    await next();
};
