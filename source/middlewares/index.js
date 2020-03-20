const fs = require('fs');
const camelcase = require('camelcase');
const middlewares = {};
const files = fs.readdirSync(__dirname);
const jsFiles = files.filter((f) => {
    return f.endsWith('.js') && !f.startsWith('index');
});
jsFiles.forEach((file) => {
    const fileName = file.substring(0, file.length - 3);
    const m = require(__dirname + '/' + file);
    // simulate es exports in commonjs for test
    if (m.default) middlewares[camelcase(fileName)] = m.default;
    else middlewares[camelcase(fileName)] = m;
});

module.exports = middlewares;
