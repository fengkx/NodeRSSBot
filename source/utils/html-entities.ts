/**
 * HTML entity decoder for href attribute values.
 *
 * When discovering RSS feeds from HTML, href attributes may contain entity-encoded
 * characters (e.g., href="...?a=1&amp;b=2"). This decoder converts them to their
 * literal characters so URLs can be properly parsed and stored.
 */

/**
 * Common named HTML entities and their character equivalents.
 */
const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00A0'
};

/**
 * Decode HTML entities in a string.
 *
 * Supports:
 * - Named entities: &amp; &lt; &gt; &quot; &apos; &nbsp;
 * - Numeric entities (decimal): &#38; &#60;
 * - Numeric entities (hex): &#x26; &#x3C;
 *
 * @param text - String potentially containing HTML entities
 * @returns String with entities decoded to their literal characters
 */
export function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&([a-z]+);/gi, (match, entityName) => {
            const normalized = entityName.toLowerCase();
            return NAMED_ENTITIES[normalized] ?? match;
        })
        .replace(/&#(\d+);/g, (_match, decimal) => {
            return String.fromCharCode(parseInt(decimal));
        })
        .replace(/&#x([0-9a-f]+);/gi, (_match, hexadecimal) => {
            return String.fromCharCode(parseInt(hexadecimal, 16));
        });
}
