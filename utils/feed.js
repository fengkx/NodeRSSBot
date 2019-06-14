const cheerio = require('cheerio');
const RSSParser = require('rss-parser');
exports.isFeedValid = async function (feedStr) {
    const parser = new RSSParser();
    try {
        await parser.parseString(feedStr)
    } catch (e) {
        return false;
    }
    return true;
}

exports.findFedd = async function (html) {
    const $ = cheerio.load(html);
    return $('[rel=alternate]')
        .get()
        .map((i) => {
            i = $(i);
            return i.attr('href');
        });
}
