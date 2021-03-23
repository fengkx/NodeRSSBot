export function decodeUrl(url: string): string {
    while (url !== decodeURIComponent(url)) {
        url = decodeURIComponent(url);
    }
    return url;
}

//https://github.com/miniflux/v2/pull/541
export function encodeUrl(url: string): string {
    const [first, ...rest] = url.split('?');
    const u = new URL(first);
    if (rest.length > 0) {
        const queryStr = rest.join('?');
        const query = new URLSearchParams(queryStr);
        query.sort();
        const search =
            '?' +
            [...query.entries()]
                .map(([k, v]) => {
                    k = encodeURIComponent(k);
                    v = encodeURIComponent(v);
                    if (v.length === 0) {
                        return k;
                    }
                    return `${k}=${v}`;
                })
                .join('&');
        u.search = search;
    }
    if (u.pathname === '/') {
        u.pathname = '';
    }
    u.hash = ''; // strip URL fragments
    return u.toString();
}
