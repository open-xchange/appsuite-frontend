/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

exports.command = function (parameters) {
    // make sure, parameters is an array
    parameters = [].concat(parameters);

    // make sure, launch_url has a trailing slash
    var launchURL = this.launch_url;
    if (!/\/$/.test(launchURL)) launchURL += '/';

    this
        .url(launchURL + '#' + parameters.join('&'))
        .waitForElementVisible('#io-ox-login-username', 10000)
        .setValue('#io-ox-login-username', this.globals.ox_credentials.username)
        .setValue('#io-ox-login-password', this.globals.ox_credentials.password)
        .pause(1000)
        .click('#io-ox-login-button')
        .waitForElementVisible('#io-ox-topbar', 25000);

    return this;

};
