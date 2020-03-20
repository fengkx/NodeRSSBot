const config = require('../config');
const { Pool } = require('better-sqlite-pool');

const dbPool = new Pool(config.db_path);
module.exports = dbPool;
