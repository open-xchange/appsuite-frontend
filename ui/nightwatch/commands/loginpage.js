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
 * Simple helper command to show the loginpage
 * via Option different user agents can be loaded
 * { userAgent : STRING }
 */
exports.command = function (opt) {
    this
        .url(this.launch_url)
        .execute(function (options) {
            if (options.userAgent) _.device.loadUA(options.userAgent);
        }, [opt])
        .waitForElementFocus('#io-ox-login-username', 10000);

    return this;

};
