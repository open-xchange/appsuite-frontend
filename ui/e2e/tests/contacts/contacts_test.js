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

Feature('Contacts @contentReview');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});


Scenario('[C7354] - Create new contact', function (I) {
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('a.dropdown-toggle.disabled');
    // toolbar dropdown
    I.retry(5).click('New contact');
    // real action in dropdown
    I.waitForVisible('.dropdown-menu');
    I.click('New contact', '[data-action="io.ox/contacts/actions/create"]');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.checkOption('Show all fields');
    I.fillField('Title', 'Sir');
    I.fillField('First name', 'Richard');
    I.fillField('Last name', 'Petersen');
    I.fillField('Middle name', 'Holger');
    I.fillField('Suffix', 'Pro');
    I.selectOption('month', 'May');
    I.selectOption('date', '4');
    I.selectOption('year', '1957');
    I.fillField('URL', 'my.homepage.com');
    // job description
    I.fillField('Profession', 'Developer');
    I.fillField('Position', 'Senior Developer');
    I.fillField('Department', 'Frontend');
    I.fillField('Company', 'Open-Xchange');
    I.fillField('Room number', '101');
    // messaging
    I.fillField('Email 1', 'email1@test');
    I.fillField('Email 2', 'email2@test');
    I.fillField('Email 3', 'email3@test');
    I.fillField('Instant Messenger 1', 'instantmessenger1');
    I.fillField('Instant Messenger 2', 'instantmessenger2');
    // phone and fax
    I.fillField('Cell phone', 'cell phone');
    I.fillField('Cell phone (alt)', 'cell phone alt');
    I.fillField('Phone (business)', 'phone business');
    I.fillField('Phone (business alt)', 'phone business alt');
    I.fillField('Phone (home)', 'phone home');
    I.fillField('Phone (home alt)', 'phone home alt');
    I.fillField('Phone (other)', 'phone other');
    I.fillField('Fax', 'fax');
    I.fillField('Fax (Home)', 'fax home');
    // home address
    I.fillField('street_home', 'Home Street');
    I.fillField('postal_code_home', '12345');
    I.fillField('city_home', 'Home City');
    I.fillField('state_home', 'Home State');
    I.fillField('country_home', 'Home County');
    // business address
    I.fillField('street_business', 'Business Street');
    I.fillField('postal_code_business', '23456');
    I.fillField('city_business', 'Business City');
    I.fillField('state_business', 'Business State');
    I.fillField('country_business', 'Business County');
    // other address
    I.fillField('street_other', 'Other Street');
    I.fillField('postal_code_other', '34567');
    I.fillField('city_other', 'Other City');
    I.fillField('state_other', 'Other State');
    I.fillField('country_other', 'Other County');
    // coment
    I.fillField('note', 'a comment in the comment field');

    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.waitForElement('.fa-spin-paused');
    //wait for detail view
    I.click('.io-ox-contacts-window .leftside');
    I.pressKey('End');
    I.pressKey('Enter');
    I.waitForVisible('.io-ox-contacts-window .leftside .vgrid-cell.selected');
    // personal information
    I.see('Sir');
    I.see('Richard');
    I.see('Petersen');
    I.see('Holger');
    I.see('Pro');
    I.see('5/4/1957');
    I.see('http://my.homepage.com');
    // job description
    I.see('Developer');
    I.see('Senior Developer');
    I.see('Frontend');
    I.see('Open-Xchange');
    I.see('101');
    // mail and messaging
    I.see('email1@test');
    I.see('email2@test');
    I.see('email3@test');
    I.see('instantmessenger1');
    I.see('instantmessenger2');
    // phone numbers
    I.see('cell phone');
    I.see('cell phone alt');
    I.see('phone business');
    I.see('phone business alt');
    I.see('phone home');
    I.see('phone home alt');
    I.see('phone other');
    I.see('fax');
    I.see('fax home');
    // business address
    I.see('Business Street');
    I.see('Business City');
    I.see('Business State');
    I.see('12345');
    I.see('BUSINESS COUNTY');
    // home address
    I.see('Home Street');
    I.see('Home City');
    I.see('Home State');
    I.see('23456');
    I.see('HOME COUNTY');
    // other address
    I.see('Other Street');
    I.see('Other City');
    I.see('Other State');
    I.see('34567');
    I.see('OTHER COUNTY');
    // comment
    I.see('a comment in the comment field');
});

Scenario('[C7355] - Create a new private folder', function (I) {
    const timestamp = Math.round(+new Date() / 1000);
    I.login('app=io.ox/contacts');
    // wait for any contact to be rendered, this is the last thing happening on load.
    I.waitForElement('.vgrid-cell.contact');
    I.click('Add new address book');
    I.waitForElement('.modal-open [data-point="io.ox/core/folder/add-popup"]');
    I.fillField('[name="name"]', 'C7355 ' + timestamp);
    I.click('[data-action="add"]');
    I.waitForDetached('[data-point="io.ox/core/folder/add-popup"]');
    I.selectFolder('C7355 ' + timestamp);
    I.waitForText('C7355 ' + timestamp, '.folder-name');
});

Scenario('[C7356] - Create a new public folder', function (I) {
    const timestamp = Math.round(+new Date() / 1000);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.waitForText('Add new address book');
    I.click('Add new address book');
    I.waitForElement('.modal-open [data-point="io.ox/core/folder/add-popup"]');
    I.fillField('[name="name"]', 'C7356 ' + timestamp);
    I.click('.modal-open .checkbox label');
    I.click('[data-action="add"]');
    I.waitForDetached('[data-point="io.ox/core/folder/add-popup"]');
    I.selectFolder('C7356 ' + timestamp);
    I.waitForText('C7356 ' + timestamp, '.folder-name');
    I.waitForText('C7356 ' + timestamp, '[data-id="virtual/flat/contacts/public"] .folder-node');
});

Scenario('[C7358] - Remove contact picture @shaky', function (I, search) {
    const testrailID = 'C7358';
    const phone = '+4917113371337';

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('a.dropdown-toggle.disabled');
    // toolbar dropdown
    I.click('New contact');
    // real action in dropdown
    I.waitForVisible('.dropdown-menu');
    I.click('New contact', '[data-action="io.ox/contacts/actions/create"]');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('First name', testrailID);
    I.fillField('Last name', testrailID);
    I.fillField('Cell phone', phone);
    I.waitForElement('.contact-picture-upload');
    I.click('.contact-picture-upload');
    I.waitForText('Edit image');
    I.attachFile('.picture-upload-view input[type=file]', 'e2e/media/files/generic/contact_picture.png');
    I.click('Ok');
    I.waitForDetached('.modal-dialog');
    I.dontSee('Upload image');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    search.doSearch(testrailID + ' ' + testrailID);
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.contact-header');
    I.waitForText(testrailID + ', ' + testrailID, '.contact-header .header-name');
    I.clickToolbar('Edit');
    I.click(".edit-contact [title='Remove']");
    I.click('Save');
    //Verify that picture is removed
});

Scenario('[C7359] - Expand/collapse all contact edit sections', function (I) {

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('a.dropdown-toggle.disabled');
    // toolbar dropdown
    I.retry(5).click('New contact');
    // real action in dropdown
    I.waitForVisible('.dropdown-menu');
    I.retry(5).click('New contact', '[data-action="io.ox/contacts/actions/create"]');
    I.waitForVisible('.io-ox-contacts-edit-window');

    I.checkOption('Show all fields');
    // personal information
    I.fillField('Title', 'Sir');
    I.fillField('First name', 'Richard');
    I.fillField('Last name', 'Petersen');
    I.fillField('Middle name', 'Holger');
    I.fillField('Suffix', 'Pro');
    I.selectOption('month', 'May');
    I.selectOption('date', '4');
    I.selectOption('year', '1957');
    I.fillField('URL', 'my.homepage.com');
    // job description
    I.fillField('Profession', 'Developer');
    I.fillField('Position', 'Senior Developer');
    I.fillField('Department', 'Frontend');
    I.fillField('Company', 'Open-Xchange');
    I.fillField('Room number', '101');
    // messaging
    I.fillField('Email 1', 'email1@test');
    I.fillField('Email 2', 'email2@test');
    I.fillField('Email 3', 'email3@test');
    I.fillField('Instant Messenger 1', 'instantmessenger1');
    I.fillField('Instant Messenger 2', 'instantmessenger2');
    // phone and fax
    I.fillField('Cell phone', 'cell phone');
    I.fillField('Cell phone (alt)', 'cell phone alt');
    I.fillField('Phone (business)', 'phone business');
    I.fillField('Phone (business alt)', 'phone business alt');
    I.fillField('Phone (home)', 'phone home');
    I.fillField('Phone (home alt)', 'phone home alt');
    I.fillField('Phone (other)', 'phone other');
    I.fillField('Fax', 'fax');
    I.fillField('Fax (Home)', 'fax home');
    // home address
    I.fillField('street_home', 'Home Street');
    I.fillField('postal_code_home', '12345');
    I.fillField('city_home', 'Home City');
    I.fillField('state_home', 'Home State');
    I.fillField('country_home', 'Home County');
    // business address
    I.fillField('street_business', 'Business Street');
    I.fillField('postal_code_business', '23456');
    I.fillField('city_business', 'Business City');
    I.fillField('state_business', 'Business State');
    I.fillField('country_business', 'Business County');
    // other address
    I.fillField('street_other', 'Other Street');
    I.fillField('postal_code_other', '34567');
    I.fillField('city_other', 'Other City');
    I.fillField('state_other', 'Other State');
    I.fillField('country_other', 'Other County');
    // coment
    I.fillField('note', 'a comment in the comment field');
    I.click('Show all fields');

    I.wait(1);
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');

    // wait for detail view
    I.click('.io-ox-contacts-window .leftside');
    I.pressKey('End');
    I.pressKey('Enter');
    I.waitForVisible('.io-ox-contacts-window .leftside .vgrid-cell.selected');
    // personal information
    I.see('Sir');
    I.see('Richard');
    I.see('Petersen');
    I.see('Holger');
    I.see('Pro');
    I.see('5/4/1957');
    I.see('http://my.homepage.com');
    // job description
    I.see('Developer');
    I.see('Senior Developer');
    I.see('Frontend');
    I.see('Open-Xchange');
    I.see('101');
    // mail and messaging
    I.see('email1@test');
    I.see('email2@test');
    I.see('email3@test');
    I.see('instantmessenger1');
    I.see('instantmessenger2');
    // phone numbers
    I.see('cell phone');
    I.see('cell phone alt');
    I.see('phone business');
    I.see('phone business alt');
    I.see('phone home');
    I.see('phone home alt');
    I.see('phone other');
    I.see('fax');
    I.see('fax home');
    // business address
    I.see('Business Street');
    I.see('Business City');
    I.see('Business State');
    I.see('12345');
    I.see('BUSINESS COUNTY');
    // home address
    I.see('Home Street');
    I.see('Home City');
    I.see('Home State');
    I.see('23456');
    I.see('HOME COUNTY');
    // other address
    I.see('Other Street');
    I.see('Other City');
    I.see('Other State');
    I.see('34567');
    I.see('OTHER COUNTY');
    // comment
    I.see('a comment in the comment field');
});

Scenario('[C7363] - Add files to a contact @shaky', async function (I) {
    const testrailID = 'C7363';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID
    };
    await I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForText('My address books');
    I.selectFolder('Contacts');
    I.retry(5).click(locate().withText('C7363, C7363').inside('.vgrid-scrollpane-container'));
    I.clickToolbar('Edit');
    I.waitForVisible('[data-app-name="io.ox/contacts/edit"]');
    I.attachFile('.contact_attachments_buttons input[type=file]', 'e2e/media/files/generic/contact_picture.png');
    I.waitForElement(locate().withText('contact_picture.png').inside('.attachment'));
    I.click('Save');
    I.waitForInvisible('[data-app-name="io.ox/contacts/edit"]');
    I.waitForElement(locate().withText('contact_picture.png').inside('.attachments-container .dropdown-toggle'));
});

Scenario('[C7366] - Delete multiple contacts', async function (I, search) {
    const testrailID = 'C7366';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID

    };
    await I.haveContact(contact);
    await I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    search.doSearch(testrailID + ' ' + testrailID);
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.fa-spin-paused');
    I.pressKey(['\uE009', 'a']);
    //I.pressKey(['Control', 'a']);
    I.waitForElement('.fa-spin-paused');
    I.clickToolbar('Delete');
    I.waitForVisible('.modal-dialog');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.dontSee('C7367, C7367');
});

Scenario('[C7367] - Delete Contact', async function (I) {
    const testrailID = 'C7367';
    const contact = {
        display_name: testrailID + ', ' + testrailID,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID

    };
    await I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForElement('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.contact-header');
    I.waitForText(testrailID + ', ' + testrailID, '.contact-header .header-name');
    I.clickToolbar('Delete');
    I.waitForVisible('.modal-dialog');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('[aria-label="' + testrailID + ', ' + testrailID + '"]');
});

Scenario('[C7369] - Search by Name', async function (I, search) {
    const testrailID = 'C7369';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID
    };
    I.haveContact(contact);

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');

    search.doSearch(testrailID + ' ' + testrailID);
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
});

Scenario('[C7370] - Search by Phone numbers', async function (I, search) {
    const phone = '+4917113371337';
    const testrailID = 'C7370';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');

    search.doSearch(phone);

    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
});

Scenario('[C7371] - Search by Addresses', async function (I, search) {
    const testrailID = 'C7371';
    const firstname = testrailID;
    const lastname = testrailID;

    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: '+4917113371337',
        street_home: 'street_home',
        post_code_home: '1337',
        city_home: 'city_home',
        state_home: 'state_home',
        country_home: 'country_home'
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    search.doSearch(contact.street_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(contact.post_code_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(contact.city_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(contact.state_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(contact.country_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
});

Scenario('[C8817] - Send E-Mail to contact', function (I, users, search) {
    const testrailID = 'C8817';
    const subject = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    search.doSearch(users[1].userdata.primaryEmail);
    I.waitForElement('[href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.click('[href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.waitForVisible('.io-ox-mail-compose');
    I.waitForElement('.floating-window-content .container.io-ox-mail-compose .mail-compose-fields');
    I.waitForVisible({ css: 'textarea.plain-text' });
    I.wait(0.2);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, testrailID);
    I.seeInField({ css: 'textarea.plain-text' }, testrailID);
    I.click('Send');
    I.waitForElement('.fa-spin-paused');
    I.wait('1');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForElement('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.doubleClick('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.see(testrailID + ' - ' + subject);
    I.see(testrailID);
});

Scenario.skip('[C273805] - Download infected file', async function (I) {
    const testrailID = 'C273805';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID

    };
    const contactResponse = await I.haveContact(contact);
    await I.haveAttachment('contacts', { id: contactResponse.id, folder: contact.folder_id }, 'e2e/media/mails/Virus_attached!.eml');
    I.login('app=io.ox/contacts');
    I.waitForElement('.vgrid-cell.contact');
    I.selectFolder('Contacts');
    I.waitForElement(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.waitForElement(locate('.dropdown').withText('Virus_attached!.eml').inside('.contact-header'));
    I.click(locate('.dropdown').withText('Virus_attached!.eml').inside('.contact-header'));
    I.waitForElement(locate('[data-action="io.ox/core/tk/actions/download-attachment"]').withText('Download').inside('.dropdown.open'));
    I.click(locate('[data-action="io.ox/core/tk/actions/download-attachment"]').withText('Download').inside('.dropdown.open'));
    I.waitForElement(locate('.modal-open .modal-title').withText('Malicious file detected'));
    I.waitForElement(locate('.modal-open button').withText('Download infected file'));
    I.waitForElement(locate('.modal-open button').withText('Cancel'));
});

Scenario('[C7360] - Cancel contact modification', async function (I) {
    const phone = '+4917113371337';
    const testrailID = 'C7360';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForText(contact.first_name);
    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('department', 'Holger');
    I.click('Discard');
    I.click('Discard changes');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.dontSee('Holger');
});

Scenario('[C7361] - Edit partial data of a contact @shaky', async function (I) {
    const phone = '+4917113371337';
    const testrailID = 'C7361';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('cellular_telephone1', '+3913371337');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.dontSee(phone);
    I.see('+3913371337');
});


Scenario('[C7362] - Edit existing contact', async function (I) {
    const testrailID = 'C7362';

    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: '+4917113371337',
        street_home: '+4917113371337',
        post_code_home: '+4917113371337',
        city_home: '+4917113371337',
        state_home: '+4917113371337',
        country_home: '+4917113371337'
    };
    await I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.waitForText('+4917113371337');

    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');

    I.fillField('cellular_telephone1', '+3913371337');
    I.fillField('street_home', '+3913371337');
    I.fillField('postal_code_home', '+3913371337');
    I.fillField('city_home', '+3913371337');
    I.fillField('state_home', '+3913371337');
    I.fillField('country_home', '+3913371337');

    I.click('Save');
    I.waitForText('+3913371337');
});
