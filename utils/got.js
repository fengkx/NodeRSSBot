const got = require('got');
const config = require('../config');
const charset = require('charset');
const charDet = require('jschardet');
const iconv = require('iconv-lite');

const AcceptHeader =
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8 ';

module.exports = got.extend({
    headers: {
        'user-agent': config.UA,
        accept: AcceptHeader
    },
    timeout: {
        response: config.resp_timeout * 1000
    },
    hooks: {
        afterResponse: [
            async (res) => {
                let fromHeader = false;
                let enc = charset(res.headers['content-type']);
                if (enc) {
                    fromHeader = true;
                } else {
                    enc = charDet.detect(res.body);
                }
                if (enc !== 'utf8') {
                    res.body = await got(res.url).buffer();
                    if (!fromHeader)
                        enc = charDet.detect(res.body).encoding.toLowerCase();
                    res.body = iconv.decode(res.body, enc);
                }

                return res;
            }
        ]
    }
});
