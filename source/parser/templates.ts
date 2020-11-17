export const atomTpl = {
    version: '/feed/@xmlns',
    title: 'feed/title',
    updatedAt: 'feed/updated',
    link: 'feed/link/@href',
    items: [
        '//entry',
        {
            id: 'id',
            title: 'title',
            publishedAt: 'published',
            link: 'link'
        }
    ]
};

export const rdfTpl = {
    version: '#1',
    title: 'rdf:RDF/channel/title',
    link: 'rdf:RDF/channel/link|rss/channel/atom:link',
    items: [
        '//item',
        {
            title: 'title',
            link: 'link',
            publishedAt: 'dc:date',
            id: 'dc:identifier|link'
        }
    ]
};

export const rss2Tpl = {
    version: '/rss/@version',
    title: 'rss/channel/title',
    link: 'rss/channel/link|rss/channel/atom:link',
    updatedAt: 'rss/channel/lastBuildDate',
    items: [
        '//item',
        {
            title: 'title',
            link: 'link',
            publishedAt: 'pubDate',
            id: 'guid'
        }
    ]
};
