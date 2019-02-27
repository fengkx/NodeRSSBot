const crypto = require('crypto');

module.exports = async (feed) => {
    return new Promise((resolve) => {
        const key = feed.guid || feed.id;
        if (key) {
            const md5Hash = crypto.createHash('md5');
            md5Hash.update(key);
            const hexHash = md5Hash.digest('hex');
            resolve(hexHash.substr(0, 8));
        } else {
            const md5Hash = crypto.createHash('md5');
            md5Hash.update(feed.link, 'utf8');
            md5Hash.update(feed.title, 'utf8');
            const hexHash = md5Hash.digest('hex');
            resolve(hexHash.substr(0, 8));
        }
    });
};
