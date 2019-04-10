/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Mailfilter');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C83386] Create mail filter based on mail', async function (I, users) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[0] });

    I.login('app=io.ox/mail', { user: users[0] });

    // compose mail for user 1
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.waitForElement('~Sent, 1 total');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
    I.waitForElement('~Trash');
    I.click('~More actions', '.inline-toolbar');
    I.waitForElement('.dropdown.open');
    I.see('Create filter rule', '.dropdown.open');
    I.click('Create filter rule');
    I.waitForText('Create new rule');

    // add action
    I.click('Add action');
    I.click('File into');

    I.click('Select folder');
    I.waitForElement('.folder-picker-dialog');

    I.waitForElement('[data-id="default0/INBOX/Trash"]', '.folder-picker-dialog');
    I.click('[data-id="default0/INBOX/Trash"]', '.folder-picker-dialog');
    I.waitForElement('[data-id="default0/INBOX/Trash"].selected', '.folder-picker-dialog');
    I.wait(1);
    I.click('Ok');
    // save the form
    I.click('Save');

    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });

    // compose mail for user 1
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.waitForElement('~Sent, 1 total');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // check for mail
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
    I.waitForElement('~Trash, 1 unread, 1 total');

});
