/**
 * Decode HTML entities in a string.
 * Handles common entities found in HTML href attributes.
 */
export function decodeHtmlEntities(text: string): string {
    // Map of named entities to characters
    const entities: Record<string, string> = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
        nbsp: '\u00A0'
    };

    return text
        .replace(/&([a-z]+);/gi, (match, entity) => {
            const lower = entity.toLowerCase();
            return entities[lower] || match;
        })
        .replace(/&#(\d+);/g, (_match, dec) => {
            return String.fromCharCode(parseInt(dec));
        })
        .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
}
