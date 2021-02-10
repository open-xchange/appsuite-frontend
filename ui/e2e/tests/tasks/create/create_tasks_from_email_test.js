/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
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
