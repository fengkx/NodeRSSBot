const config = require('../config');
const sqlite = require('sqlite');

const dbPromise = sqlite.open(config.db_path, { Promise });
module.exports = dbPromise;
