import {readdir, cp as cpy} from 'node:fs/promises'
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.join(dirname(fileURLToPath(import.meta.url)), '..')

const i18n = [
    path.join(projectRoot, 'i18n'),
    path.join(projectRoot, 'dist/i18n'),
    async (dst) => {
        const files = await readdir(dst);
        files.some(f => f.endsWith('yaml'))
    }
];
const template = [
    path.join(projectRoot, 'source/template'),
    path.join(projectRoot, 'dist/source/template'),
    async (dst) => {
        const files = await readdir(dst);
        files.some(f => f.endsWith('ejs'))
    }
]

const parisOfPathToCopy = [
    i18n,
    template
]

try {
    await Promise.all(parisOfPathToCopy.map(async ([src, dst, checker]) => {
        await cpy(src, dst, {recursive: true});
        if(!checker(dst)) {
            throw new Error(`Asset copy path is wrong ${src}`)
        }
    }))
} catch (err) {
    console.error(err);
    process.exit(1);
}
