const { htmlEscape } = require('escape-goat');

// escape and clean up text to send in telegram
module.exports = function(s) {
    return htmlEscape(
        s
            .trim()
            .replace(/\n/g, '') // \n don't display in html text
            .replace(/ +/g, ' ') // display like html
    );
};
