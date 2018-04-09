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

BeforeSuite(async function (I, users) {
    users.push(await I.createUser(users.create()));
});

AfterSuite(async function (I, users) {
    await I.removeUsers(users);
});

Scenario('lists all sessions', function (I, users) {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/sessions'], { user: users[0] });
    I.waitForVisible('.io-ox-session-settings');
    I.see('You are currently signed in with the following devices');

    // web clients
    I.see('Calendar(Mac)');
    I.see('Addressbook(Mac)');
    I.see('Exchange Active Sync(Mac)');
    I.see('OXDrive(Android)');
    I.see('OX Mail(iOS)');
    I.see('Safari(iOS)');
    I.see('Firefox(Mac)');
    I.see('Chrome(Mac)');

    I.logout();
});
