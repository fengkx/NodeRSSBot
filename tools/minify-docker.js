const path = require('path');
const { nodeFileTrace } = require('@vercel/nft');
const cpy = require('cpy');

const files = [
    'dist/source/index.js',
    'node_modules/cross-env/src/bin/cross-env.js',
    'node_modules/cross-env/src/index.js',
    'dist/source/utils/fetch.js'
];
const resultFolder = 'node_modules-minimal';

(async () => {
    const cache = Object.create(null);
    const { fileList } = await nodeFileTrace(files, {
        base: path.resolve(path.join(__dirname, '..')),
        cache
    });
    const deps = Array.from(fileList).filter((f) => f.includes('node_modules'));
    return cpy(deps, path.resolve(resultFolder), {
        parents: true
    });
})();
