export function decodeUrl(url: string): string {
    while (url !== decodeURIComponent(url)) {
        url = decodeURIComponent(url);
    }
    return url;
}
