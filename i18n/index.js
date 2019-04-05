const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const yamlPath = path.join(__dirname, `${config.lang}.yaml`);

let base = fs.readFileSync(path.join(__dirname, 'en.yaml'), {
    encoding: 'utf-8'
});
base = yaml.safeLoad(base);

const yamlStr = fs.readFileSync(yamlPath, {
    encoding: 'utf-8'
});

module.exports = Object.assign(base, yaml.safeLoad(yamlStr));
