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

exports.command = function (parameters, userIndex) {
    // make sure, parameters is an array
    parameters = [].concat(parameters);

    userIndex = userIndex || 0;

    // make sure, launch_url has a trailing slash
    var launchURL = this.launch_url;
    if (!/\/$/.test(launchURL)) launchURL += '/';

    var users = this.globals.users;
    if (!users || !users.length) this.assert.fail('user not found', 'A configured user', 'Expected at least one configured user in the global array "users".');
    if (users.length < userIndex) this.assert.fail('user not found', 'A user at index ' + userIndex, 'Expected a configured user in the globals "users" array at position ' + userIndex + '.');
    var user = this.globals.users[userIndex];
    if (!user.username) this.assert.fail('user without username', 'A configured username for user at index ' + userIndex, 'Expected a user with username when calling login.');
    if (!user.password) this.assert.fail('user without password', 'A configured password for user at index ' + userIndex, 'Expected a user with password when calling login.');

    this
        .url(launchURL + '#' + parameters.join('&'))
        .waitForElementVisible('#io-ox-login-username', 10000)
        .setValue('#io-ox-login-username', user.username)
        .setValue('#io-ox-login-password', user.password)
        .waitForElementEventListener('#io-ox-login-form', 'submit', 2000)
        .click('#io-ox-login-button')
        .waitForElementVisible('#io-ox-topbar', 25000);

    return this;

};
