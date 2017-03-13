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

exports.command = function () {

    this
        .waitForElementVisible('#io-ox-topbar-dropdown-icon', 25000)
        .click('#io-ox-topbar-dropdown-icon > a.dropdown-toggle')
        .waitForElementVisible('#topbar-settings-dropdown')
        .click('#topbar-settings-dropdown > a[data-action="logout"')
        .waitForElementVisible('#io-ox-login-username', 10000);

    return this;

};
