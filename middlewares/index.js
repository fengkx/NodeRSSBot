const fs = require('fs');
const camelcase = require('camelcase');
const middlewares = {};
const files = fs.readdirSync(__dirname);
const jsFiles = files.filter((f) => {
    return f.endsWith('.js') && !f.startsWith('index');
});
jsFiles.forEach((file) => {
    const fileName = file.substring(0, file.length - 3);
    middlewares[camelcase(fileName)] = require(__dirname + '/' + file);
});

module.exports = middlewares;
