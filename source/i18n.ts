import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { I18n, I18nLang } from './types/i18n';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('../i18n', import.meta.url));
const result: I18n = {};
const localeDir = path.join(__dirname, '../i18n'); // /dist/source/i18n -> /dist/[i18n]
console.log(__dirname, localeDir);
const baseStr = fs.readFileSync(path.join(localeDir, 'en.yaml'), {
    encoding: 'utf8'
});

const codes = fs
    .readdirSync(localeDir)
    .filter((i) => i.endsWith('.yaml'))
    .map((i) => {
        return i.substr(0, i.length - 5);
    });

const cache = new Map<string, I18nLang>();
for (const code of codes) {
    Object.defineProperty(result, code, {
        enumerable: true,
        get(): I18nLang {
            if (!cache.has(code)) {
                const translation = Object.assign(
                    yaml.load(baseStr),
                    yaml.load(
                        fs.readFileSync(path.join(localeDir, `${code}.yaml`), {
                            encoding: 'utf8'
                        })
                    )
                ) as I18nLang;

                cache.set(code, translation);
            }
            return cache.get(code);
        }
    });
}
export default result;
