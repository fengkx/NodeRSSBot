const cheerio = require('cheerio');
const RSSParser = require('rss-parser');

exports.isFeedValid = async function(feedStr) {
    const parser = new RSSParser();
    let feed;
    try {
        feed = await parser.parseString(feedStr);
    } catch (e) {
        return false;
    }
    return feed;
};

exports.findFeed = async function(html, reqUrl) {
    reqUrl = new URL(reqUrl);
    const $ = cheerio.load(html);
    const urls = $('head')
        .find('[rel=alternate]')
        .get()
        .map((i) => {
            i = $(i);
            const url = i.attr('href');
            try {
                return new URL(url).toString();
            } catch (e) {
                reqUrl.pathname = url;
                return reqUrl.toString();
            }
        });
    return urls;
};
