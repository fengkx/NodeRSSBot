/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
try {
    const pg = require('pg');
    pg.types.setTypeParser(20, 'text', parseInt);
} catch (err) {
    logger.info('There is no pg');
}
import { config } from './config';
import { parse } from 'url';
import { Knex } from 'knex';
import { join } from 'path';
import logger from './utils/logger';

const SQLITE_CLIENT = 'sqlite';

const parsed = parse(config.db_path);
const isWindows = process && process.platform && process.platform === 'win32';
let { protocol } = parsed,
    client;
const isDriveLetter = isWindows && protocol && protocol.length === 2;
if (protocol === null || isDriveLetter) {
    client = SQLITE_CLIENT;
} else if (protocol.slice(-1) === ':') {
    protocol = protocol.slice(0, -1);
    client = protocol;
}

const knexConfig: Knex.Config = {
    client,
    connection: config.db_path,
    migrations: {
        tableName: 'knex_migrations',
        extension: 'ts',
        directory: join(__dirname, 'migrations')
    },
    pool: {
        min: 1,
        max: client === SQLITE_CLIENT ? 4 : 8,
        acquireTimeoutMillis: 1000 * 5 * 60, // timeout 5 minutes
        afterCreate: (conn: any, done: (err: Error, conn: any) => void) => {
            if (client === SQLITE_CLIENT) {
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
