const got = require('got');
const config = require('../config');
const charset = require('charset');
const charDet = require('jschardet');
const iconv = require('iconv-lite');

module.exports = got.extend({
    headers: {
        'user-agent': config.UA
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
                    res.body = await got(res.url, {
                        encoding: 'buffer'
                    });
                    if (!fromHeader)
                        enc = charDet
                            .detect(res.body.body)
                            .encoding.toLowerCase();
                    res.body = iconv.decode(res.body.body, enc);
                }

                return res;
            }
        ]
    }
});
