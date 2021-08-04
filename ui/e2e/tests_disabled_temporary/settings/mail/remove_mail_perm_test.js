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

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7771] Permanently remove deleted mails', async ({ I, users, mail, dialogs }) => {
    const user = users[0];

    await I.haveMail({
        attachments: [{
            content: 'Lorem ipsum',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Delete this',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail');
    I.waitForVisible('.io-ox-mail-settings');
    I.click('Permanently remove deleted emails');

    I.openApp('Mail');
    mail.waitForApp();

    I.waitForText('Delete this');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.wait(1);
    I.click('Delete');

    dialogs.waitForVisible();
    I.waitForText('Do you want to permanently delete this mail?', dialogs.locators.body);
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Trash');
    I.waitForText('Empty');
});

