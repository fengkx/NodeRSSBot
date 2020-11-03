import { config } from './config';
import { parse } from 'url';
import { Config } from 'knex';
import { join } from 'path';
import logger from './utils/logger';

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
const knexConfig: Config = {
    client,
    connection: config.db_path,
    migrations: {
        tableName: 'knex_migrations',
        extension: 'ts',
        directory: join(__dirname, 'migrations')
    },
    pool: {
        afterCreate: (conn, done) => {
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
