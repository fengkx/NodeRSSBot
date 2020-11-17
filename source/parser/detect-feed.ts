import { transform } from 'camaro';

export async function detectFeed(xml: string): Promise<TDocTypeVersion> {
    const docType = await transform(xml, {
        rss: 'rss/channel/title',
        atom: 'feed/title',
        rdf: 'rdf:RDF'
    });

    if (docType.rss) {
        const version = parseFloat(docType.rssVersion);
        return {
            docType: 'rss',
            version,
            isGooglePlay: /xmlns:googleplay/.test(xml),
            isItunes: /xmlns:itunes/.test(xml)
        };
    }
    // rdf is rss version 1
    if (docType.rdf) {
        return {
            docType: 'rdf',
            version: 1
        };
    }
    if (docType.atom) {
        return {
            docType: 'atom'
        };
    }
    throw new Error('No a supported xml format');
}

export interface AtomTypeVersion {
    docType: 'atom';
}
export interface RSSTypeVersion {
    docType: 'rss';
    version: number;
    isItunes?: boolean;
    isGooglePlay?: boolean;
}
export interface RDFTypeVersion {
    docType: 'rdf';
    version: 1;
}
export type TDocTypeVersion = AtomTypeVersion | RSSTypeVersion | RDFTypeVersion;
