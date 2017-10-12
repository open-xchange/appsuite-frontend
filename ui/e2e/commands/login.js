const _ = require('underscore'),
    codecept = require('codeceptjs');

module.exports = function (params, options) {
    params = [].concat(params);
    options = _.extend({
        userIndex: 0,
        prefix: ''
    }, options);

    let config = codecept.config.get(),
        webDriver = config.helpers['WebDriverIO'];

    var launchURL = webDriver.url;
    if (launchURL.search('appsuite\\/?$') >= 0) launchURL = launchURL.substring(0, launchURL.search('appsuite\\/?$'));
    if (!/\/$/.test(launchURL)) launchURL += '/';
    launchURL += options.prefix;
    if (!/\/$/.test(launchURL)) launchURL += '/';
    launchURL += 'appsuite/';

    this.amOnPage(launchURL + '#' + params.join('&'));
    this.waitForFocus('input[name="username"]');
    this.fillField('username', global.users[options.userIndex].username);
    this.fillField('password', global.users[options.userIndex].password);
    this.waitToHide('.busy');
    this.click('Sign in');
    this.waitForElement('#io-ox-topbar', 20);
};
