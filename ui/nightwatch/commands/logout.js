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

/**
 * This will logout the user and should be called at the end of every test.
 * @param endSession {boolean} optional, default true
 * @param cb {function} optional, a callback which is executed after the logout
 */
exports.command = function (endSession, cb) {

    this
        .clickWhenVisible('#io-ox-topbar-dropdown-icon > a.dropdown-toggle', 25000)
        .clickWhenVisible('.dropdown.open a[data-action="logout"]')
        .waitForElementVisible('#io-ox-login-username', 10000)
        .assert.visible('#io-ox-login-username');

    this.perform(function (api, done) {
        if (endSession !== false) api.end();
        if (cb) cb.call(api);
        done();
    });

    return this;

};
