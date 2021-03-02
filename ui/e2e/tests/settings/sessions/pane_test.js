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

Feature('Settings');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const data = [{
    client: { type: 'browser', family: 'chrome' },
    os: { name: 'macos' }
}, {
    client: { type: 'browser', family: 'firefox' },
    os: { name: 'macos' }
}, {
    client: { type: 'browser', family: 'safari' },
    os: { name: 'ios' }
}, {
    client: { type: 'oxapp', family: 'oxmailapp' },
    os: { name: 'ios' }
}, {
    client: { type: 'oxapp', family: 'oxdriveapp' },
    os: { name: 'android' }
}, {
    client: { type: 'dav', family: 'macos_calendar' },
    os: { name: 'macos' }
}, {
    client: { type: 'dav', family: 'macos_addressbook' },
    os: { name: 'macos' }
}, {
    client: { type: 'eas', family: 'usmeasclient' },
    os: { name: 'macos' }
}].map((d, i) => ({
    ipAddress: '827.23.423.23',
    location: 'Leipzig / Germany',
    lastActive: 1498215192675 + i * 2880817633,
    loginTime: 1498215192675,
    sessionId: i.toString(),
    ...d
}));

// TODO can be unskipeed as soon as the problems with JellyJS mock server are fixed (see https://github.com/Netflix/pollyjs/issues/248)
Scenario.skip('lists all sessions', function ({ I }) {

    I.mockRequest('GET', '/appsuite/api/sessionmanagement', data);

    I.login(['app=io.ox/settings', 'folder=virtual/settings/sessions']);
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
});
