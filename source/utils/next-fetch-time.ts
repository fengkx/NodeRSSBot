export function nextFetchTimeStr(minutes: number, now = Date.now()) {
    // use SQLite CURRENT_TIMESTAMP return format like `2021-03-09 06:23:43`
    // It should use the UTC timezone
    return new Date(now + minutes * 60 * 1000)
        .toISOString()
        .split('.')[0]
        .replace('T', ' ');
}
