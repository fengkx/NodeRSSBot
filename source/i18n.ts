const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const result = {};
const localeDir = path.join(__dirname, '../i18n');
const baseStr = fs.readFileSync(path.join(localeDir, 'en.yaml'));

fs.readdirSync(localeDir)
    .filter((i) => i.endsWith('.yaml'))
    .map((i) => {
        const code = i.substr(0, i.length - 5);
        result[code] = Object.assign(
            yaml.safeLoad(baseStr),
            yaml.safeLoad(fs.readFileSync(path.join(localeDir, `${code}.yaml`)))
        );
        return code;
    });

module.exports = result;
