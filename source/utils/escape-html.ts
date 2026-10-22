import { escapeHTML } from 'fast-escape-html';

/**
 * Escape HTML special characters for raw data in Telegram HTML messages.
 * Use this for URLs, identifiers, and data that must preserve exact formatting.
 *
 * Escapes: &, <, >, ", and ' characters
 * Preserves: all whitespace (including newlines and multiple spaces)
 *
 * For titles and content text, use sanitize() instead, which also cleans
 * whitespace by removing newlines and collapsing multiple spaces.
 */
export default function escapeHtml(s: string): string {
    return escapeHTML(s);
}
