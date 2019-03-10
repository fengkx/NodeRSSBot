const got = require('got');
const config = require('../config');

module.exports = got.extend({
    headers: {
        'user-agent': config.UA
    }
});
