import { none, Option, Optional } from '../types/option';
import { parseString, TRSS } from '../parser/parse';
import { FeedItem } from '../types/feed';
import hashFeed from './hash-feed';

export async function isFeedValid(feedStr: string): Promise<Option<TRSS>> {
    try {
        const feed = await parseString(feedStr);
        return Optional(feed);
    } catch {
        return none;
    }
}

export async function findFeed(
    html: string,
    reqUrl: string
): Promise<string[]> {
    const reqURL = new URL(reqUrl);
    const linksTag = html.match(/<link[^>]+rel="alternate"[^>]+\/?>/g);
    if (!linksTag) {
        return [];
    }
    return linksTag
        .filter((t) => t.match(/rss|atom/) && t.includes('href'))
        .map((linkTag) => {
            const url = linkTag.match(/href="(.+?)"/)[1];
            try {
                return new URL(url).toString();
            } catch {
                reqURL.pathname = url;
                return reqURL.toString();
            }
        });
}

export async function getNewItems(
    oldHashList: string[],
    items: FeedItem[]
): Promise<[FeedItem[], string[]]> {
    const newItems = [];
    const newHashList = [];

    const hashedItem = await Promise.all(
        items.map(async (item: FeedItem) => {
            const hash = await hashFeed(item);
            return { hash, item };
        })
    );
    for (const v of hashedItem) {
        const { hash, item } = v;
        if (!oldHashList.includes(hash)) {
            newItems.push(item);
            newHashList.push(hash);
        }
    }
    const appendLen = items.length * 2 - newHashList.length;
    for (let i = 0; i < appendLen && i < oldHashList.length; i++) {
        newHashList.push(oldHashList[i]);
    }

    return [newItems, newHashList];
}
