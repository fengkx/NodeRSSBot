import { htmlEscape } from 'escape-goat';

// escape and clean up text to send in telegram
export default function (s: string): string {
    return htmlEscape(
        s
            .trim()
            .replace(/\n/g, '') // \n don't display in html text
            .replace(/ +/g, ' ') // display like html
    );
}
