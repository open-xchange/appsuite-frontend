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

Feature('testrail - contacts').tag('2');

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
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
    I.wait(0.3); //dirty quickfix. sometimes test fails - > Need a more solid helper/actor for toolbar (with dropdown)
    I.click('Add contact');
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
    I.fillField('Department', 'Frontent');
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
    I.see('Frontent');
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
    I.see('Business County');
    // home address
    I.see('Home Street');
    I.see('Home City');
    I.see('Home State');
    I.see('23456');
    I.see('Home County');
    // other address
    I.see('Other Street');
    I.see('Other City');
    I.see('Other State');
    I.see('34567');
    I.see('Other County');
    // comment
    I.see('a comment in the comment field');
});

Scenario('[C7355] - Create a new private folder', function (I) {
    var timestamp = Math.round(+new Date() / 1000);
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
    var timestamp = Math.round(+new Date() / 1000);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
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

Scenario('[C7358] - Remove contact picture', function (I, search) {
    var firstname = 'C7358';
    var lastname = 'C7358';
    var phone = '+4917113371337';

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
    I.click('Add contact');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('First name', firstname);
    I.fillField('Last name', lastname);
    I.fillField('Cell phone', phone);
    I.waitForElement('.contact-picture-upload');
    I.click('.contact-picture-upload');
    I.waitForText('Edit image');
    I.attachFile('.picture-upload-view input[type=file]', 'e2e/media/files/generic/contact_picture.png');
    //Wait for UI feedback
    I.click('Ok');
    I.waitForDetached('.modal-dialog');
    //wait for element detached
    I.dontSee('Upload image');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    search.doSearch(lastname + ' ' + firstname);
    // I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    // I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    I.click('[aria-label="' + lastname + ', ' + firstname + '"]');
    I.waitForElement('.contact-header');
    I.waitForText(lastname + ', ' + firstname, '.contact-header .header-name');
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
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
    I.click('Add contact');
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
    I.fillField('Department', 'Frontent');
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
    I.see('Frontent');
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
    I.see('Business County');
    // home address
    I.see('Home Street');
    I.see('Home City');
    I.see('Home State');
    I.see('23456');
    I.see('Home County');
    // other address
    I.see('Other Street');
    I.see('Other City');
    I.see('Other State');
    I.see('34567');
    I.see('Other County');
    // comment
    I.see('a comment in the comment field');
});

Scenario('[C7363] - Add files to a contact', async function (I, users) {
    var testrailID = 'C7363';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID
    };
    await I.haveContact(contact, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.selectFolder('Contacts');
    I.click(locate().withText('C7363, C7363').inside('.vgrid-scrollpane-container'));
    I.clickToolbar('Edit');
    I.waitForVisible('[data-app-name="io.ox/contacts/edit"]');
    I.attachFile('.contact_attachments_buttons input[type=file]', 'e2e/media/files/generic/contact_picture.png');
    I.waitForElement(locate().withText('contact_picture.png').inside('.attachment'));
    I.click('Save');
    I.waitForInvisible('[data-app-name="io.ox/contacts/edit"]');
    I.waitForElement(locate().withText('contact_picture.png').inside('.attachments-container .dropdown-toggle'));
});

Scenario('[C7366] - Delete multiple contacts', async function (I, search, users) {
    let testrailID = 'C7366';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID

    };
    I.haveContact(contact, { user: users[0] });
    I.haveContact(contact, { user: users[0] });
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
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.dontSee('C7367, C7367');
});

Scenario('[C7367] - Delete Contact', async function (I, users) {
    let testrailID = 'C7367';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID

    };
    I.haveContact(contact, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForElement('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.contact-header');
    I.waitForText(testrailID + ', ' + testrailID, '.contact-header .header-name');
    I.clickToolbar('Delete');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('[aria-label="' + testrailID + ', ' + testrailID + '"]');
});

Scenario('[C7369] - Search by Name', async function (I, search, users) {
    const testrailID = 'C7369';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID
    };
    I.haveContact(contact, { user: users[0] });

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    //I.clickToolbar('New');
    //I.click('Add contact');
    //I.waitForVisible('.io-ox-contacts-edit-window');
    //I.fillField('First name', firstname);
    //I.fillField('Last name', lastname);
    //I.click('Save');
    //I.waitForDetached('.io-ox-contacts-edit-window');
    search.doSearch(testrailID + ' ' + testrailID);
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
});

Scenario('[C7370] - Search by Phone numbers', async function (I, search, users) {
    let phone = '+4917113371337';
    let testrailID = 'C7370';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    I.haveContact(contact, { user: users[0] });

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    //I.clickToolbar('New');
    //I.click('Add contact');
    //I.waitForVisible('.io-ox-contacts-edit-window');
    //I.fillField('First name', firstname);
    //I.fillField('Last name', lastname);
    //I.fillField('Cell phone', phone);
    //I.click('Save');
    //I.waitForDetached('.io-ox-contacts-edit-window');

    //I.fillField('Search...', phone)
    search.doSearch(phone);
    //I.pressKey("Enter");
    //I.waitForElement('.fa-spin-paused');
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(testrailID, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
});

Scenario('[C7371] - Search by Addresses', async function (I, search, users) {
    let testrailID = 'C7371';
    let firstname = testrailID;
    let lastname = testrailID;
    let phone = '+4917113371337';
    let street_home = 'street_home';
    let post_code_home = '1337';
    let city_home = 'city_home';
    let state_home = 'state_home';
    let country_home = 'country_home';

    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone,
        street_home: street_home,
        post_code_home: post_code_home,
        city_home: city_home,
        state_home: state_home,
        country_home: country_home
    };
    I.haveContact(contact, { user: users[0] });

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    search.doSearch(street_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(post_code_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(city_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(state_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    search.doSearch(country_home);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
});

Scenario('[C8817] - Send E-Mail to contact', function (I, users, search) {
    let [user] = users;
    var testrailID = 'C8817';
    //var text = Math.round(+new Date() / 1000);
    var subject = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/contacts', { user });
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

Scenario.skip('[C273805] - Download infected file', async function (I, users) {
    let testrailID = 'C273805';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID

    };
    const contactResponse = await I.haveContact(contact, { user: users[0] });
    await I.haveAttachment('contacts', { id: contactResponse.id, folder: contact.folder_id }, 'e2e/media/mails/Virus_attached!.eml', { user: users[0] });
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
