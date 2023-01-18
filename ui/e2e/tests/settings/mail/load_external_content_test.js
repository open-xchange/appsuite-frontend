/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario.skip('[7817] Pre-loading external content', async ({ I, users }) => {
    const u = users[0];
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'tests/settings/mail/test_external_image.eml'
    }, { u });

    I.login('app=io.ox/settings&folder=virtual/settings/security', { u });
    I.waitForText('Allow pre-loading of externally linked images');
    I.click('Allow pre-loading of externally linked images');
    I.openApp('Mail');
    I.waitForText('Richtig gutes Zeug');
    I.click('Richtig gutes Zeug', '.list-item.selectable');
    I.waitForVisible('h1.subject');
    within({ frame: '.mail-detail-frame' }, async () => {
        I.seeElement('img');
    });
    // this seems faster than navigating back to settings page manually
    I.logout();
    I.login('app=io.ox/settings&folder=virtual/settings/security', { u });
    I.waitForText('Allow pre-loading of externally linked images');
    I.click('Allow pre-loading of externally linked images');
    I.openApp('Mail');
    I.waitForText('Richtig gutes Zeug');
    I.click('Richtig gutes Zeug', '.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.see('External images have been blocked to protect you against potential spam!');
});
