/** Telegram message text limit, counted in UTF-16 code units. */
export const MESSAGE_LIMIT = 4096;
/** Telegram answerCbQuery toast text limit. */
export const CB_QUERY_TEXT_LIMIT = 200;

const graphemes = new Intl.Segmenter();

export function limitText(text: string, limit = MESSAGE_LIMIT): string {
    if (text.length <= limit) return text;
    for (const { index, segment } of graphemes.segment(text)) {
        if (index + segment.length > limit - 1) {
            return text.slice(0, index) + '…';
        }
    }
    return text;
}
