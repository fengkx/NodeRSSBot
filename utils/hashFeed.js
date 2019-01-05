const crypto = require('crypto');

module.exports = async (feedUrl, title) => {
    return new Promise((resolve) => {
        const md5Hash = crypto.createHash('md5');
        md5Hash.update(feedUrl, 'utf8');
        md5Hash.update(title, 'utf8');
        const hexHash = md5Hash.digest('hex');
        resolve(hexHash.substr(0, 8));
    });
};
