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

/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7488] [C7484] Add/Remove Inbox widget', async ({ I, users, dialogs, portal }) => {
    let [user] = users;
    await I.haveMail({
        attachments: [{
            content: 'Test mail\r\n',
            content_type: 'text/plain',
            raw: true,
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    //Add Inbox widget to Portal
    I.login('app=io.ox/portal');
    portal.waitForApp();
    portal.addWidget('Inbox');

    //Verify mail is shown in the list
    I.waitForElement('~Inbox');
    I.waitForElement('.widget[aria-label="Inbox"] .subject');
    I.see('Test subject', '.widget[aria-label="Inbox"]');

    // remove Inbox widget from portal
    I.click('~Inbox, Disable widget');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');

    // verify that the widget is removed
    I.dontSee('~Inbox');
});
