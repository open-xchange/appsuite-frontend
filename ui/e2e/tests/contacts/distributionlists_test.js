/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('testrail - distributionlists @codeReview');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7372] Create new distribution list', function (I, users) {
    var testrailID = 'C7372';
    var timestamp = Math.round(+new Date() / 1000);

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.doubleClick('~My address books');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
    I.waitForElement('.open.dropdown [data-action="io.ox/contacts/actions/distrib"]');
    //I.click('Add distribution list');
    I.click('.open.dropdown [data-action="io.ox/contacts/actions/distrib"]');
    I.waitForVisible('.floating-window-content .create-distributionlist.container');
    I.fillField('Name', testrailID + ' - ' + timestamp);
    I.fillField('Add contact', users[0].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Add contact', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Add contact', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('Add contact', users[3].userdata.primaryEmail);
    I.pressKey('Enter');
    I.click('Create list');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.wait(3);
    I.retry(5).doubleClick('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.see(testrailID + ' - ' + timestamp);
    I.see('Distribution list with 4 entries');
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
});

Scenario('[C7373] Modify distribution list members', async function (I, users) {
    var testrailID = 'C7373';
    var timestamp = Math.round(+new Date() / 1000);

    const contact2 = {
        display_name: '' + testrailID + ' - ' + timestamp + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true,
        distribution_list: [{
            display_name: users[0].userdata.display_name,
            folder_id: 6,
            id: users[0].userdata.id,
            mail: users[0].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[1].userdata.display_name,
            folder_id: 6,
            id: users[1].userdata.id,
            mail: users[1].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[2].userdata.display_name,
            folder_id: 6,
            id: users[2].userdata.id,
            mail: users[2].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[3].userdata.display_name,
            folder_id: 6,
            id: users[3].userdata.id,
            mail: users[3].userdata.primaryEmail,
            mail_field: 1
        }
        ]
    };
    await I.haveContact(contact2, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
    I.clickToolbar('Edit');
    I.waitForElement('.form-control.add-participant.tt-input');
    I.fillField('.form-control.add-participant.tt-input', 'john.doe@open-xchange.com');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 5 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:john.doe@open-xchange.com"]');
    I.clickToolbar('Edit');
    I.waitForElement('//*[contains(@class, "create-distributionlist container")]//a[contains(text(), "' + users[0].userdata.primaryEmail + '")]/../..//a[contains(@class, "remove")]');
    I.click('//*[contains(@class, "create-distributionlist container")]//a[contains(text(), "' + users[0].userdata.primaryEmail + '")]/../..//a[contains(@class, "remove")]');
    I.waitForElement('//*[contains(@class, "create-distributionlist container")]//a[contains(text(), "' + users[1].userdata.primaryEmail + '")]/../..//a[contains(@class, "remove")]');
    I.click('//*[contains(@class, "create-distributionlist container")]//a[contains(text(), "' + users[1].userdata.primaryEmail + '")]/../..//a[contains(@class, "remove")]');
    I.click('Save');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 3 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:john.doe@open-xchange.com"]');
    I.see('Distribution list with 3 entries');
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
    I.see('john.doe@open-xchange.com');
});

Scenario('[C7374] Modify distribution list name', async function (I, users) {
    var testrailID = 'C7374';
    var timestamp = Math.round(+new Date() / 1000);
    const contact2 = {
        display_name: '' + testrailID + ' - ' + timestamp + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true,
        distribution_list: [{
            display_name: users[0].userdata.display_name,
            folder_id: 6,
            id: users[0].userdata.id,
            mail: users[0].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[1].userdata.display_name,
            folder_id: 6,
            id: users[1].userdata.id,
            mail: users[1].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[2].userdata.display_name,
            folder_id: 6,
            id: users[2].userdata.id,
            mail: users[2].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[3].userdata.display_name,
            folder_id: 6,
            id: users[3].userdata.id,
            mail: users[3].userdata.primaryEmail,
            mail_field: 1
        }
        ]
    };
    await I.haveContact(contact2, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForElement('.contact-grid-container');
    I.retry(5).click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp);
    I.waitForText('Distribution list with 4 entries');
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
    //Edit
    I.clickToolbar('Edit');
    I.waitForElement('[name="display_name"]');
    I.fillField('[name="display_name"]', testrailID + ' - ' + timestamp + ' - ' + testrailID);
    I.click('Save');
    I.retry(5).click('[aria-label="' + testrailID + ' - ' + timestamp + ' - ' + testrailID + '"]');
    I.see(testrailID + ' - ' + timestamp + ' - ' + testrailID);
    I.see('Distribution list with 4 entries');
    I.see(users[0].userdata.primaryEmail);
    I.see(users[1].userdata.primaryEmail);
    I.see(users[2].userdata.primaryEmail);
    I.see(users[3].userdata.primaryEmail);
});

Scenario('[C7375] Move a distribution list', async function (I, users) {
    var testrailID = 'C7375';
    var timestamp = Math.round(+new Date() / 1000);
    const contact2 = {
        display_name: '' + testrailID + ' - ' + timestamp + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true,
        distribution_list: [{
            display_name: users[0].userdata.display_name,
            folder_id: 6,
            id: users[0].userdata.id,
            mail: users[0].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[1].userdata.display_name,
            folder_id: 6,
            id: users[1].userdata.id,
            mail: users[1].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[2].userdata.display_name,
            folder_id: 6,
            id: users[2].userdata.id,
            mail: users[2].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[3].userdata.display_name,
            folder_id: 6,
            id: users[3].userdata.id,
            mail: users[3].userdata.primaryEmail,
            mail_field: 1
        }
        ]
    };
    await I.haveContact(contact2, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.click('Add new address book');
    I.waitForElement('.modal-open [data-point="io.ox/core/folder/add-popup"]');
    I.fillField('[placeholder="New address book"][type="text"]', testrailID);
    I.click('Add');
    I.waitForDetached('.modal-open [data-point="io.ox/core/folder/add-popup"]');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[aria-label="Address Book Toolbar"] .more-dropdown a');
    I.click('.dropdown.open [data-action="io.ox/contacts/actions/move"]');
    I.waitForElement('.modal [data-id="virtual/flat/contacts/private"] div.folder-arrow');
    I.click('.modal [data-id="virtual/flat/contacts/private"] div.folder-arrow');
    I.waitForElement('.modal [aria-label="' + testrailID + '"]');
    I.click('.modal [aria-label="' + testrailID + '"]');
    I.waitForDetached('.btn-primary[disabled=""]');
    I.click('[type="button"][data-action="ok"]');
    I.selectFolder('Contacts');
    I.waitForDetached('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.selectFolder(testrailID);
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.retry(3).click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
});

Scenario('[C7376] Send a mail to distribution list', async function (I, users) {
    var testrailID = 'C7376';
    var timestamp = Math.round(+new Date() / 1000);
    const contact2 = {
        display_name: '' + testrailID + ' - ' + timestamp + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true,
        distribution_list: [{
            display_name: users[0].userdata.display_name,
            folder_id: 6,
            id: users[0].userdata.id,
            mail: users[0].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[1].userdata.display_name,
            folder_id: 6,
            id: users[1].userdata.id,
            mail: users[1].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[2].userdata.display_name,
            folder_id: 6,
            id: users[2].userdata.id,
            mail: users[2].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[3].userdata.display_name,
            folder_id: 6,
            id: users[3].userdata.id,
            mail: users[3].userdata.primaryEmail,
            mail_field: 1
        }
        ]
    };
    await I.haveContact(contact2, { user: users[0] });
    I.haveSetting('io.ox/mail//messageFormat', 'text');

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
    I.clickToolbar('Send email');
    I.waitForVisible({ css: 'textarea.plain-text' });
    I.waitForElement('.io-ox-mail-compose [name="subject"]');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.waitForElement('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.waitForElement('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.waitForElement('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
    I.logout();

    I.login('app=io.ox/mail', { user: users[3] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.waitForElement('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[title="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.mail-detail-pane .subject');
});

Scenario('[C7377] Copy distribution list', async function (I, users) {
    var testrailID = 'C7377';
    var timestamp = Math.round(+new Date() / 1000);
    const contact2 = {
        display_name: '' + testrailID + ' - ' + timestamp + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true,
        distribution_list: [{
            display_name: users[0].userdata.display_name,
            folder_id: 6,
            id: users[0].userdata.id,
            mail: users[0].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[1].userdata.display_name,
            folder_id: 6,
            id: users[1].userdata.id,
            mail: users[1].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[2].userdata.display_name,
            folder_id: 6,
            id: users[2].userdata.id,
            mail: users[2].userdata.primaryEmail,
            mail_field: 1
        }, {
            display_name: users[3].userdata.display_name,
            folder_id: 6,
            id: users[3].userdata.id,
            mail: users[3].userdata.primaryEmail,
            mail_field: 1
        }
        ]
    };
    await I.haveContact(contact2, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.click('Add new address book');
    I.waitForElement('.modal-open [data-point="io.ox/core/folder/add-popup"]');
    I.waitForElement('[placeholder="New address book"][type="text"]');
    I.fillField('[placeholder="New address book"][type="text"]', testrailID);
    I.click('Add');
    I.waitForDetached('.modal-open [data-point="io.ox/core/folder/add-popup"]');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
    I.click('[aria-label="Address Book Toolbar"] .more-dropdown a');
    I.click('.dropdown.open [data-action="io.ox/contacts/actions/copy"]');
    I.waitForElement('.modal [data-id="virtual/flat/contacts/private"] div.folder-arrow');
    I.click('.modal [data-id="virtual/flat/contacts/private"] div.folder-arrow');
    I.waitForElement('.modal [aria-label="' + testrailID + '"]');
    I.click('.modal [aria-label="' + testrailID + '"]');
    I.click('[type="button"][data-action="ok"]');
    I.selectFolder('Contacts');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
    I.selectFolder(testrailID);
    I.waitForElement('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.retry(3).click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.waitForText(testrailID + ' - ' + timestamp, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[2].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[3].userdata.primaryEmail + '"]');
});

Scenario('[C7378] Delete multiple distribution lists', async function (I, users, search) {
    var testrailID = 'C7378';
    var timestamp = Math.round(+new Date() / 1000);

    const contact1 = {
        display_name: '' + testrailID + ' - ' + timestamp + ' - 1',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true

    };
    const contact2 = {
        display_name: '' + testrailID + ' - ' + timestamp + ' - 2',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true

    };
    I.haveContact(contact1, { user: users[0] });
    I.haveContact(contact2, { user: users[0] });

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    search.doSearch(testrailID + ' - ' + timestamp);
    I.click('.select-all');
    I.clickToolbar('Delete');
    I.click('[role="alertdialog"] [type="button"][data-action="delete"]');
    I.wait(1);
    I.dontSee(testrailID + ' - ' + timestamp + ' - 1');
    I.dontSee(testrailID + ' - ' + timestamp + ' - 2');
});

Scenario('[C7379] Delete distribution list', async function (I, users) {
    var testrailID = 'C7379';
    var timestamp = Math.round(+new Date() / 1000);

    const contact = {
        display_name: '' + testrailID + ' - ' + timestamp + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        mark_as_distributionlist: true

    };
    I.haveContact(contact, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.wait(1);
    I.click('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
    I.clickToolbar('Delete');
    I.click('.btn-primary');

    I.dontSee('[aria-label="' + testrailID + ' - ' + timestamp + '"]');
});
