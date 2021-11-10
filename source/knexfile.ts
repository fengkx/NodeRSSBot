/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
import { config } from './config.js';
import { parse, fileURLToPath } from 'url';
import { Knex } from 'knex';
import logger from './utils/logger.js';

const parsed = parse(config.db_path);
const isWindows = process && process.platform && process.platform === 'win32';
let { protocol } = parsed,
    client;
const isDriveLetter = isWindows && protocol && protocol.length === 2;
if (protocol === null || isDriveLetter) {
    client = 'sqlite';
} else if (protocol.slice(-1) === ':') {
    protocol = protocol.slice(0, -1);
    client = protocol;
}
// console.log(config.db_path);
const knexConfig: Knex.Config = {
    client,
    connection: config.db_path,
    migrations: {
        // @ts-expect-error esm
        esm: true,
        tableName: 'knex_migrations',
        extension: 'ts',
        directory: fileURLToPath(new URL('migrations', import.meta.url))
    },
    pool: {
        min: 1,
        max: client === 'sqlite' ? 4 : 4,
        acquireTimeoutMillis: 1000 * 5 * 60, // timeout 5 minutes
        afterCreate: (conn: any, done: (err: Error, conn: any) => void) => {
            if (client === 'sqlite') {
                conn.run('PRAGMA foreign_keys = ON;', function (err) {
                    done(err, conn);
                });
            } else {
                conn.query('SELECT 1;', function (err) {
                    done(err, conn);
                });
            }
        }
    },
    log: logger
};

export default knexConfig;
