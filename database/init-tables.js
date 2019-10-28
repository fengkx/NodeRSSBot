const config = require('../config');
const fs = require('fs');
const logger = require('../utils/logger');
const errors = require('../utils/errors');

const dbPool = require('./index');
const initTables = async () => {
    if (!fs.existsSync(__dirname + '/sql/create_tables.sql')) {
        throw errors.newCtrlErr('CAN_INIT_DB');
    }
    const sql = fs.readFileSync(__dirname + '/sql/create_tables.sql', {
        encoding: 'utf-8'
    });
    const db = await dbPool.acquire();
    db.exec(sql);
    db.release();
    logger.info(`init tables in ${config.db_path}`);
};

module.exports = initTables;
