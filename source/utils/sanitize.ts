import { escapeHTML } from 'fast-escape-html';

// escape and clean up text to send in telegram
export default function (s: string): string {
    return escapeHTML(
        s
            .trim()
            .replace(/\n/g, '') // \n don't display in html text
            .replace(/ +/g, ' ') // display like html
    );
}

// Strip EJS template delimiters from untrusted input as defense-in-depth
// This prevents template injection even if the input is incorrectly concatenated
// into a template string elsewhere in the codebase
export function stripEjsDelimiters(s: string): string {
    return s.replace(/<%/g, '&lt;%').replace(/%>/g, '%&gt;');
}
