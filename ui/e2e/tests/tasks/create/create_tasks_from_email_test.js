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

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7737] Create Task from email @shaky', async (I, users) => {

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
    I.waitForVisible('[data-ref="io.ox/mail/listview"]');

    let mailCount = await I.grabNumberOfVisibleElements('.list-item');
    let retries = 6;

    while (mailCount < 1) {
        if (retries > 0) {
            I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
            I.click('#io-ox-refresh-icon', '.taskbar');
            I.waitForElement('.launcher .fa-spin-paused', 5);
            I.wait(60);
            console.log('No mail(s) found. Waiting 1 minute ...');
            mailCount = await I.grabNumberOfVisibleElements('.list-item');
            retries--;
        } else {
            console.log('Timeout exceeded. No mails found.');
            break;
        }
    }

    // 2. Mark an email from an other user andclick "more" "Reminder"

    I.click('.list-item[aria-label*="Deutscher Meister 1.FC Köln"]');
    I.waitForVisible('~More actions');

    I.click('~More actions');
    I.waitForVisible('.smart-dropdown-container');

    I.click('Reminder', '.smart-dropdown-container');
    I.waitForText('Remind me');

    // 3. Enter a Subject, a note and set the Reminder to "in 5 minutes", click "Create reminder"

    // "Subject" and "Remind me" are already prefilled. Only need to click "Create"
    I.click('Create reminder');
    I.waitForText('Reminder has been created');

    // 4. Switch to Tasks.

    I.openApp('Tasks');

    // 5. Mark the created reminder.
    // Task is created manually. No need to mark it manually.

    I.waitForVisible('~Task Details');
    I.see('Deutscher Meister 1.FC Köln', '.tasks-detailview');
});
