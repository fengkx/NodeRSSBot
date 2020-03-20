import * as cheerio from 'cheerio';
import RSSParser from 'rss-parser'

export async function isFeedValid(feedStr): Promise<RSSParser.Output|undefined> {
    const parser = new RSSParser();
    try {
        return await parser.parseString(feedStr);
    } catch (e) {
        return undefined;
    }
}

export async function findFeed(html: string, reqUrl: string): Promise<string[]> {
    const reqURL = new URL(reqUrl);
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
                reqURL.pathname = url;
                return reqURL.toString();
            }
        });
    return urls;
}
