const config = require('../config');
const fs = require('fs');
const logger = require('../utils/logger');

const dbPromise = require('./index');
const initTables = async () => {
    if (!fs.existsSync(__dirname + '/sql/create_tables.sql')) {
        throw new Error('CAN_INIT_DB');
    }
    const sql = fs.readFileSync(__dirname + '/sql/create_tables.sql', {
        encoding: 'utf-8'
    });
    const db = await dbPromise;
    await Promise.all(
        sql.split(';\n').map(async (i) => {
            if (i.trim().length !== 0) await db.run(i);
        })
    );
    logger.info(`init tables in ${config.db_path}`);
};

module.exports = initTables;
