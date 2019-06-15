const errors = require('../utils/errors');

module.exports = async (ctx, next) => {
    const { text } = ctx.message;
    const [command, url] = text.split(/\s+/);
    if (!url) {
        switch (command.substr(0, 4)) {
            case '/sub':
                throw errors.newCtrlErr('SUB_USAGE');
            case '/uns':
                if (command.substr(0, 8) === '/unsubthis')
                    throw errors.newCtrlErr('UNSUBTHIS_USAGE');
                else throw errors.newCtrlErr('UNSUB_USAGE');
            case '/exp':
                throw errors.newCtrlErr('EXPORT');
            case '/all':
                throw errors.newCtrlErr('USB_ALL_USAGE');
            case '/vie':
                throw errors.newCtrlErr('VIEW_ALL_USAGE');
        }
    }
    if (!url.startsWith('http') && !url.startsWith('https')) {
        throw errors.newCtrlErr('FEED_URL_NOT_PARSE');
    }
    ctx.state.feedUrl = decodeURI(url);
    await next();
};
