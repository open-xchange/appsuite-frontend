/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
