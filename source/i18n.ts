import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { I18n, I18nLang } from './types/i18n';

const result: I18n = {};
const localeDir = path.join(__dirname, '../i18n'); // /dist/source/i18n -> /dist/[i18n]
const baseStr = fs.readFileSync(path.join(localeDir, 'en.yaml'), {
    encoding: 'utf8'
});

fs.readdirSync(localeDir)
    .filter((i) => i.endsWith('.yaml'))
    .map((i) => {
        const code = i.substr(0, i.length - 5);
        result[code] = Object.assign(
            yaml.safeLoad(baseStr),
            yaml.safeLoad(
                fs.readFileSync(path.join(localeDir, `${code}.yaml`), {
                    encoding: 'utf8'
                })
            )
        ) as I18nLang;
        return code;
    });

export default result;
