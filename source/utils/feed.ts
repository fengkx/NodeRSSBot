import { none, Option, Optional } from '../types/option';
import { parseString, TRSS } from '../parser/parse';
import { FeedItem } from '../types/feed';
import hashFeed from './hash-feed';
import { decodeHtmlEntities } from './html-entities';

export async function isFeedValid(feedStr: string): Promise<Option<TRSS>> {
    try {
        const feed = await parseString(feedStr);
        return Optional(feed);
    } catch {
        return none;
    }
}

/**
 * Extract and decode href attribute from a link tag.
 * HTML entities in the href value are decoded to prevent double-escaping.
 */
function extractHref(linkTag: string): string | null {
    const hrefMatch = linkTag.match(/href="(.+?)"/);
    if (!hrefMatch) {
        return null;
    }
    // Decode HTML entities (e.g., &amp; -> &) before URL parsing
    return decodeHtmlEntities(hrefMatch[1]);
}

/**
 * Discover RSS/Atom feed URLs from HTML link tags.
 *
 * @param html - HTML content to search
 * @param reqUrl - Base URL for resolving relative paths
 * @returns Array of discovered feed URLs
 */
export async function findFeed(
    html: string,
    reqUrl: string
): Promise<string[]> {
    const baseUrl = new URL(reqUrl);
    const linkTags = html.match(/<link[^>]+rel="alternate"[^>]+\/?>/g);

    if (!linkTags) {
        return [];
    }

    const feedUrls: string[] = [];

    for (const linkTag of linkTags) {
        // Only process RSS/Atom feeds
        if (!linkTag.match(/rss|atom/) || !linkTag.includes('href')) {
            continue;
        }

        const href = extractHref(linkTag);
        if (!href) {
            continue;
        }

        // Try to parse as absolute URL, fall back to relative path
        try {
            feedUrls.push(new URL(href).toString());
        } catch {
            baseUrl.pathname = href;
            feedUrls.push(baseUrl.toString());
        }
    }

    return feedUrls;
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
