import RSSParser from 'rss-parser';

export async function isFeedValid(
    feedStr
): Promise<RSSParser.Output | undefined> {
    const parser = new RSSParser();
    try {
        return await parser.parseString(feedStr);
    } catch (e) {
        return undefined;
    }
}

export async function findFeed(
    html: string,
    reqUrl: string
): Promise<string[]> {
    const reqURL = new URL(reqUrl);
    const linksTag = html.match(/<link[^>]+rel="alternate"[^>]+\/?>/g);
    const urls = linksTag
        .filter((t) => t.match(/rss|atom/) && t.includes('href'))
        .map((linkTag) => {
            const url = linkTag.match(/href="(.+?)"/)[1];
            try {
                return new URL(url).toString();
            } catch (e) {
                reqURL.pathname = url;
                return reqURL.toString();
            }
        });
    return urls;
}
