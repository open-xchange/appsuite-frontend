/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../../steps.d.ts" />

Feature('Custom mail account');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7840] Delete external mail account', async ({ I, mail, settings, dialogs }) => {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');

    await I.haveMailAccount({
        name: 'External',
        extension: 'ext'
    });

    I.login();
    mail.waitForApp();
    I.waitForText('External', 10, '.folder-tree');
    I.openApp('Settings');
    settings.waitForApp();
    settings.select('Accounts');
    // wait a little for the list to settle (bug?)
    I.wait(0.5);
    I.waitForVisible('~Delete External');
    I.retry(5).click('~Delete External');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete account');
    I.waitForInvisible('~Delete External', 30);
    I.openApp('Mail');
    mail.waitForApp();
    I.waitForInvisible(locate('.folder-tree li').withText('External'), 10);
});
