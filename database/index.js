const config = require('../config');
const sqlite = require('sqlite');

// eslint-disable-next-line object-property-newline
const dbPromise = sqlite.open(config.db_path, { Promise, cached: true });
module.exports = dbPromise;
