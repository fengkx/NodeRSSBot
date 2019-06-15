const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const i18n = {};
const baseStr = fs.readFileSync(path.join(__dirname, `en.yaml`));

fs.readdirSync(__dirname)
    .filter((i) => i.endsWith('.yaml'))
    .map((i) => {
        const code = i.substr(0, i.length - 5);
        i18n[code] = Object.assign(
            yaml.safeLoad(baseStr),
            yaml.safeLoad(fs.readFileSync(path.join(__dirname, `${code}.yaml`)))
        );
        return code;
    });

module.exports = i18n;
