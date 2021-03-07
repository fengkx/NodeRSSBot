import { detectFeed } from './detect-feed';
import { transform } from 'camaro';
import { atomTpl, rdfTpl, rss2Tpl } from './templates';
export type TRSS = {
    version: string;
    title: string;
    link: string;
    updatedAt?: string;
    ttl?: number;
    items: RSSItem[];
};
export type RSSItem = {
    id: string;
    publishedAt: string;
    link: string;
    title: string;
};

export async function parseString(xml: string): Promise<TRSS> {
    const { docType } = await detectFeed(xml);
    switch (docType) {
        case 'atom':
            return await transform(xml, atomTpl);
        case 'rdf':
            return await transform(xml, rdfTpl);
        case 'rss':
            return await transform(xml, rss2Tpl);
    }
}
