export function decodeUrl(url) {
    while (url !== decodeURIComponent(url)) {
        url = decodeURIComponent(url);
    }
    return url;
}
