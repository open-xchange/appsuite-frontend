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
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Contacts > Distributionlist');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

function prepare(I) {
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    // I.doubleClick('~My address books');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.waitForElement('.contact-grid-container');
}

function uniqueName(testrailID) {
    const timestamp = Math.round(+new Date() / 1000);
    return `${testrailID} - ${timestamp}`;
}

async function createDistributionListExample(I, users, testrailID) {
    const display_name = uniqueName(testrailID),
        distribution_list = [];
    for (let i = 0; i <= 3; i++) {
        distribution_list.push({
            display_name: users[i].userdata.display_name,
            folder_id: 6,
            id: users[i].userdata.id,
            mail: users[i].userdata.primaryEmail,
            mail_field: 1
        });
    }
    await I.haveContact({
        display_name: display_name,
        folder_id: await I.grabDefaultFolder('contacts'),
        mark_as_distributionlist: true,
        distribution_list: distribution_list
    });
    return display_name;
}

Scenario('[C7372] Create new distribution list @shaky', function (I, users) {
    const display_name = uniqueName('C7372');
    prepare(I);

    I.click('New contact');
    I.click('New distribution list');
    I.waitForVisible('.floating-window-content');
    I.fillField('Name', display_name);
    for (let i = 0; i <= 3; i++) {
        I.fillField('Add contact', users[i].userdata.primaryEmail);
        I.pressKey('Enter');
    }
    I.click('Create list');
    I.waitForDetached('.floating-window-content');
    I.waitForElement(`~${display_name}`);
    I.doubleClick(`~${display_name}`);
    I.waitForText(display_name);
    I.see('Distribution list with 4 entries');
    for (let i = 0; i <= 3; i++) I.see(users[i].userdata.primaryEmail);
});

Scenario('[C7373] Modify distribution list members', async function (I, users) {
    const display_name = await createDistributionListExample(I, users, 'C7373');
    prepare(I);

    I.waitForElement(`~${display_name}`);
    I.click(`~${display_name}`);
    I.waitForText(display_name, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries');
    for (let i = 0; i <= 3; i++) I.seeElement(locate('.participant-email a').withText(users[i].userdata.primaryEmail));
    I.clickToolbar('Edit');
    I.waitForElement('.form-control.add-participant.tt-input');
    I.fillField('.form-control.add-participant.tt-input', 'john.doe@open-xchange.com');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForDetached('.floating-window');
    I.waitForText(display_name, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 5 entries', 5, '.contact-detail .header-job span');
    for (let i = 0; i <= 3; i++) I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:john.doe@open-xchange.com"]');
    I.clickToolbar('Edit');
    for (let i = 0; i <= 1; i++) {
        const removeButton = locate('.remove').after(locate('.participant-email a').withText(users[i].userdata.primaryEmail).inside('.removable')).as('remove button');
        I.waitForElement(removeButton);
        I.click(removeButton);
    }
    I.click('Save');
    I.waitForDetached('.floating-window');
    I.waitForText(display_name, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 3 entries', 5, '.contact-detail .header-job span');
    for (let i = 2; i <= 3; i++) I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');
    I.waitForElement('.contact-detail .participant-email [href="mailto:john.doe@open-xchange.com"]');
    I.see('Distribution list with 3 entries');
    for (let i = 2; i <= 3; i++) I.see(users[i].userdata.primaryEmail);
    I.see('john.doe@open-xchange.com');
});

Scenario('[C7374] Modify distribution list name', async function (I, users) {
    const testrailID = 'C7374',
        display_name = await createDistributionListExample(I, users, testrailID),
        new_name = `${display_name} - ${testrailID}`;
    prepare(I);

    I.waitForElement(`~${display_name}`);
    I.click(`~${display_name}`);
    I.waitForText('Distribution list with 4 entries');
    for (let i = 0; i <= 3; i++) I.see(users[i].userdata.primaryEmail);
    I.clickToolbar('Edit');
    I.waitForElement('[name="display_name"]');
    I.fillField('[name="display_name"]', new_name);
    I.click('Save');
    I.retry(5).click(`~${new_name}`);
    I.see(new_name);
    I.see('Distribution list with 4 entries');
    for (let i = 0; i <= 3; i++) I.see(users[i].userdata.primaryEmail);
});

Scenario('[C7375] Move a distribution list', async function (I, users) {
    const testrailID = 'C7375',
        display_name = await createDistributionListExample(I, users, testrailID);
    prepare(I);

    I.click('Add new address book');
    I.waitForElement('.modal-body');
    I.fillField('[placeholder="New address book"][type="text"]', testrailID);
    I.click('Add');
    I.waitForDetached('.modal-body');
    I.waitForElement(`~${display_name}`);
    I.retry(3).click(`~${display_name}`);

    I.clickToolbar('~More actions');
    I.click('Move');
    I.waitForText('Move', 5, '.modal-open .modal-title');
    I.waitForElement('.modal .section .folder-arrow');
    I.click('.modal .section .folder-arrow');
    I.waitForElement(`.modal .section.open [aria-label="${testrailID}"]`, 5);
    I.click(`.modal [aria-label="${testrailID}"]`);
    I.waitForEnabled('.modal button.btn-primary');
    I.click('Move', '.modal');
    I.waitForDetached('.modal,.launcher-icon.fa-refresh.fa-spin');
    I.selectFolder('Contacts');
    I.waitForDetached(`~${display_name}`);
    I.selectFolder(testrailID);
    I.waitForElement(`~${display_name}`);
    I.retry(3).click(`~${display_name}`);
    I.waitForText(display_name, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    for (let i = 0; i <= 3; i++) I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');
});

Scenario('[C7376] Send a mail to distribution list', async function (I, users) {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    const testrailID = 'C7376',
        display_name = await createDistributionListExample(I, users, testrailID);
    prepare(I);

    I.waitForElement(`~${display_name}`);
    I.retry(3).click(`~${display_name}`);
    I.waitForText(display_name, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    for (let i = 0; i <= 3; i++) I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');
    I.clickToolbar('Send email');
    I.waitForVisible('.plain-text');
    I.waitForElement('.io-ox-mail-compose [name="subject"]');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + display_name);
    I.fillField({ css: 'textarea.plain-text' }, '' + display_name);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.logout();

    for (let i = 0; i <= 3; i++) {
        I.login('app=io.ox/mail', { user: users[i] });
        I.selectFolder('Inbox');
        I.waitForVisible('.selected .contextmenu-control');
        I.waitForElement('[title="' + display_name + '"]');
        I.click('[title="' + display_name + '"]');
        I.waitForText(display_name, 5, '.mail-detail-pane .subject');
        if (i < 3) I.logout();
    }
});

Scenario('[C7377] Copy distribution list', async function (I, users) {
    const testrailID = 'C7377',
        display_name =  await createDistributionListExample(I, users, testrailID);
    prepare(I);

    I.click('Add new address book');
    I.waitForElement('.modal-body');
    I.fillField('Address book name', testrailID);
    I.click('Add');
    I.waitForDetached('.modal-body');
    I.waitForElement(`~${display_name}`);
    I.click(`~${display_name}`);
    I.waitForText(display_name, 5, '.contact-detail .display_name');
    I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
    for (let i = 0; i <= 3; i++) I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');

    I.clickToolbar('~More actions');
    I.click('Copy');
    I.waitForText('Copy', 5, '.modal-open .modal-title');
    I.waitForElement('.modal .section .folder-arrow');
    I.click('.modal .section .folder-arrow');
    I.waitForElement(`.modal .section.open [aria-label="${testrailID}"]`, 5);
    I.click(`.modal [aria-label="${testrailID}"]`);
    I.click('Copy', '.modal-footer');
    I.waitForDetached('.modal-body');

    ['Contacts', testrailID].forEach(function (folderName) {
        I.selectFolder(folderName);
        I.waitForElement(`~${display_name}`);
        I.retry(3).click(`~${display_name}`);
        I.waitForText(display_name, 5, '.contact-detail .display_name');
        I.waitForText('Distribution list with 4 entries', 5, '.contact-detail .header-job span');
        for (let i = 0; i <= 3; i++) I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');
    });
});

Scenario('[C7378] Delete multiple distribution lists', async function (I, search) {
    const display_name = uniqueName('C7378'),
        defaultFolder = await I.grabDefaultFolder('contacts'),
        distributionLists = [];
    for (let i = 1; i <= 2; i++) distributionLists.push(I.haveContact({ display_name: display_name + ' - ' + i, folder_id: defaultFolder, mark_as_distributionlist: true }));
    await Promise.all(distributionLists);
    prepare(I);

    search.doSearch(display_name);
    I.click('.select-all');
    I.clickToolbar('Delete');
    I.click('Delete', '.modal-footer');
    I.waitForDetached('.modal-body');
    I.waitForText('No matching items found.');
    for (let i = 1; i <= 2; i++) I.dontSee(`${display_name} - ${i}`);
});

Scenario('[C7379] Delete distribution list', async function (I) {
    const display_name = uniqueName('C7379');
    await I.haveContact({ display_name: display_name, folder_id: await I.grabDefaultFolder('contacts'), mark_as_distributionlist: true });
    prepare(I);

    I.click(`~${display_name}`);
    I.clickToolbar('Delete');
    I.click('Delete', '.modal-footer');
    I.waitForDetached('.modal-body');
    I.dontSee(`~${display_name}`);
});
