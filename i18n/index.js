const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const yamlPath = path.join(__dirname, `${config.lang}.yaml`);

const yamlStr = fs.readFileSync(yamlPath, {
    encoding: 'utf-8'
});

module.exports = yaml.safeLoad(yamlStr);
