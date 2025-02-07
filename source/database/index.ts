import knex from 'knex';
import { config } from '../config';
import knexConfig from '../knexfile';
import logger from '../utils/logger';
export const db = knex({
    ...knexConfig,
    debug: process.env['NODE_ENV'] === 'development'
});

export async function initDB(): Promise<void> {
    const hasKnexTable = await db.schema.hasTable(
        knexConfig.migrations.tableName
    ); // check before get currentVersion
    const currentVersion = await db.migrate.currentVersion(); // will init KnexTable
    const hasRSSFeedTable = await db.schema.hasTable('rss_feed');
    // whether use old schema in version <= 0.7
    const oldSchema = hasRSSFeedTable && !hasKnexTable;
    const oldSchemaTables = ['rss_feed', 'subscribes', 'users'];
    if (oldSchema) {
        await db.transaction(async (trx) => {
            await Promise.all(
                oldSchemaTables.map(async (tb) => {
                    return trx.schema.renameTable(tb, `${tb}_old`);
                })
            );
        });
        try {
            logger.info(
                'Migrate schema to latest version from bot version <= 0.7'
            );
            await db.migrate.latest(knexConfig.migrations);
            await db.raw('PRAGMA foreign_keys = OFF;');
            await db.transaction(async (trx) => {
                await Promise.all(
                    oldSchemaTables.map(async (tb) => {
                        await trx(tb).insert(trx(`${tb}_old`).select());
                    })
                );
                await Promise.all(
                    oldSchemaTables.map(async (tb) => {
                        await trx.schema.dropTableIfExists(`${tb}_old`);
                    })
                );
            });
            await db.raw('PRAGMA foreign_keys = ON;');
        } catch (err) {
            logger.error(err);
            process.exit(1);
        }
    } else if (config.auto_migrate || currentVersion === 'none') {
        try {
            logger.info('Migrate schema to latest version');
            await db.migrate.latest(knexConfig.migrations);
        } catch (err) {
            logger.error(err);
            process.exit(1);
        }
    }
}
// initDB().then(() => logger.info('Init table successfully'));
