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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Sessions settings');

Scenario('lists all sessions', function* (I) {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/sessions']);
    I.waitForVisible('.io-ox-session-settings');
    expect(yield I.grabTextFrom('.io-ox-session-settings > h1')).to.equal('Active clients');

    // web clients
    I.seeElement('.io-ox-session-settings .session-list-container:nth-child(2) li[data-id="0"]');
    I.seeElement('.io-ox-session-settings .session-list-container:nth-child(2) li[data-id="1"]');
    I.seeElement('.io-ox-session-settings .session-list-container:nth-child(2) li[data-id="2"]');
    // native clients
    I.seeElement('.io-ox-session-settings .session-list-container:nth-child(3) li[data-id="3"]');
    I.seeElement('.io-ox-session-settings .session-list-container:nth-child(3) li[data-id="4"]');
    // other client
    I.seeElement('.io-ox-session-settings .session-list-container:nth-child(4) li[data-id="5"]');

    I.logout();
});
