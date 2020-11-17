import { none, Option, Optional } from '../types/option';
import { TRSS, parseString } from '../parser/parse';
export async function isFeedValid(feedStr: string): Promise<Option<TRSS>> {
    try {
        const feed = await parseString(feedStr);
        return Optional(feed);
    } catch (e) {
        return none;
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
