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

describe('Appsuite demo test', function () {

    describe('with Nightwatch', function () {

        it('login into appsuite', function (client) {
            client
                .login()
                .waitForElementVisible('#io-ox-topbar', 25000)
                .assert.title('App Suite.');

            client.logout();

        });
    });
});
