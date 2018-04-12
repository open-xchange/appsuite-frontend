const codecept = require('codeceptjs');

module.exports = {

    getURLRoot: function () {
        const config = codecept.config.get(),
            webDriver = config.helpers['WebDriverIO'],
            url = webDriver.url,
            pathArray = url.split('/'),
            protocol = pathArray[0],
            host = pathArray[2];
        return `${protocol}//${host}`;
    }

};
