const axios = require('axios');
const config = require('../config');

axios.defaults.headers.common['User-Agent'] = config.UA;

module.exports = axios;
