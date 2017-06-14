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

describe('Sessions settings', function () {

    it.only('lists all sessions', function (client) {

        client
            .login(['app=io.ox/settings', 'folder=virtual/settings/sessions'])
            .waitForElementVisible('.io-ox-session-settings', 20000)
            .assert.containsText('.io-ox-session-settings > h1', 'Active clients');

        client
            .waitForElementVisible('.io-ox-session-settings .settings-list-view', 5000);
        // mobile clients
        client.assert.elementPresent('.io-ox-session-settings .session-list-container:nth-child(2) li[data-id="2"]');
        client.assert.elementPresent('.io-ox-session-settings .session-list-container:nth-child(2) li[data-id="3"]');
        client.assert.elementPresent('.io-ox-session-settings .session-list-container:nth-child(2) li[data-id="4"]');
        // desktop clients
        client.assert.elementPresent('.io-ox-session-settings .session-list-container:nth-child(3) li[data-id="0"]');
        client.assert.elementPresent('.io-ox-session-settings .session-list-container:nth-child(3) li[data-id="1"]');
        // other client
        client.assert.elementPresent('.io-ox-session-settings .session-list-container:nth-child(4) li[data-id="5"]');


        client.logout();
    });

});
