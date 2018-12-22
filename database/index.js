const config = require('../config');
const sqlite = require('sqlite');
const fs = require('fs');

const dbPromise = sqlite.open(config.db_path, {Promise});
module.exports = dbPromise;
