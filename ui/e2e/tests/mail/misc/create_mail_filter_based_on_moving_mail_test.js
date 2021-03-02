/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Misc');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C83387] Create mail filter based on moving mail', async ({ I, users, mail, dialogs }) => {

    // 1. Login User#A
    // 2. Go to Mail and send a mail to User#B

    await I.haveMail({
        attachments: [{
            content: 'Content#1',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[users[1].get('display_name'), users[1].get('primaryEmail')]],
        sendtype: 0,
        subject: 'Subject#1',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user: users[1] });

    // 3. Login User#B
    // 4. Go to Mail module and select the previous send mail

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.retry(5).click('.list-item[aria-label*="Subject#1"]');

    // 5. Open context menu either in detailed view or in top bar
    // TODO: Maybe swap out with uncertain future actor methods in move_copy_test.js
    I.waitForVisible('.detail-view-header');
    within('.detail-view-header', () => {
        I.waitForVisible('~More actions', 5);
    });
    I.click('~More actions', '.detail-view-header');

    // 6. Click "Move"
    I.clickDropdown('Move');
    dialogs.waitForVisible();
    I.waitForText('Move', 5, dialogs.locators.header);

    // 7. Select "Create filter rule" checkbox

    I.checkOption('Create filter rule', dialogs.locators.footer);

    // 8. Choose destination folder (e.g. TRASH)

    I.click(
        locate('.folder-label')
            .withText('Trash')
            .inside('.folder-picker-dialog'));

    // 9. Hit "Move"

    dialogs.clickButton('Move');
    I.waitForText('Create new rule', 5, dialogs.locators.header);

    // 10. Set a name for the filter
    // Filter name is already set. Check if it prefilled.

    I.seeInField('#rulename', 'Move mails from ' + users[1].get('primaryEmail') + ' into folder Trash');

    I.see('Address', '.tests');
    I.see('Is exactly', '.tests');
    I.seeInField({ css: '[id*="address"]' }, users[1].get('primaryEmail'));

    I.see('File into', '.actions');
    I.seeInField({ css: '[id*="move"]' }, 'Trash');

    // 11. Save filter
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    // 12. As User#A send again a mail to User#B

    await I.haveMail({
        attachments: [{
            content: 'Content#2',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[users[1].get('display_name'), users[1].get('primaryEmail')]],
        sendtype: 0,
        subject: 'Subject#2',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user: users[1] });

    I.triggerRefresh();
    I.waitForElement('~Trash, 1 unread, 2 total.', 10);

    I.click('~Trash, 1 unread, 2 total.');

    I.waitForText('Subject#1', 10, '.list-view');
    I.waitForText('Content#1', 10, '.list-view');

    I.waitForText('Subject#2', 5, '.list-view');
    I.waitForText('Content#2', 5, '.list-view');
});
