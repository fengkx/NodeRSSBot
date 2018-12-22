const config = require('../config');
const sqlite = require('sqlite');
const fs = require('fs');

const dbPromise = sqlite.open(config.db_path, {Promise});
const initTables = async () => {
    const sql = fs.readFileSync(__dirname + '/sql/create_tables.sql',
        {encoding: 'utf-8'}
    );
    // console.log(sql)
    const db = await dbPromise;
    await db.run(sql)
};

module.exports = initTables;
