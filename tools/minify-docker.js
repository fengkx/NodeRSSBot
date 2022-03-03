const path = require('path');
const { nodeFileTrace } = require('@vercel/nft');
const cpFile = require('cp-file');

const files = [
    'dist/source/index.js',
    'node_modules/cross-env/src/bin/cross-env.js',
    'node_modules/cross-env/src/index.js',
    'dist/source/utils/fetch.js'
];
const resultFolder = path.resolve('node_modules-minimal');

(async () => {
    const cache = Object.create(null);
    const { fileList } = await nodeFileTrace(files, {
        base: path.resolve(path.join(__dirname, '..')),
        cache
    });
    const deps = Array.from(fileList).filter((f) => f.includes('node_modules'));
    await Promise.all(
        deps.map(async (f) => {
            cpFile(f, path.join(resultFolder, f));
        })
    );
})();
