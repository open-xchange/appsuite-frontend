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

Feature('Tasks > Create');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7737] Create Task from email', async ({ I, users, mail }) => {

    // Precondition: Have an email from an other user in the inbox.

    await I.haveMail({
        attachments: [{
            content: 'Wir gratulieren dem 1.FC Köln zur Deutschen Fußballmeisterschaft der Saison 2019/20',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[users[0].get('display_name'), users[0].get('primaryEmail')]],
        sendtype: 0,
        subject: 'Deutscher Meister 1.FC Köln',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user: users[0] });

    // 1. Switch to Mail

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.triggerRefresh();

    // 2. Mark an email from an other user andclick "more" "Reminder"
    mail.selectMail('Deutscher Meister 1.FC Köln');
    I.waitForFocus('.list-item.selected');

    I.waitForVisible('~More actions', 5, '.mail-detail-pane');

    I.click('~More actions', '.mail-detail-pane');
    I.waitForElement('.dropdown.open');

    I.click('Reminder', '.dropdown.open .dropdown-menu');
    I.waitForText('Remind me');

    // 3. Enter a Subject, a note and set the Reminder to "in 5 minutes", click "Create reminder"

    // "Subject" and "Remind me" are already prefilled. Only need to click "Create"
    I.click('Create reminder');
    I.waitForText('Reminder has been created');

    // 4. Switch to Tasks.

    I.openApp('Tasks');

    // 5. Mark the created reminder.
    // Task is created manually. No need to mark it manually.

    I.waitForText('Deutscher Meister 1.FC Köln', 10, '.tasks-detailview');
});
