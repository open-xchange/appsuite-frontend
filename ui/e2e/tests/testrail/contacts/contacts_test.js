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
/// <reference path="../../../steps.d.ts" />

Feature('testrail - contacts');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});


Scenario('C7354 - Create new contact', function (I) {
    //define testrail ID
    it('(C7354) Create new contact');

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
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

    I.logout();
});

Scenario('C7355 - Create a new private folder', function (I) {
    var timestamp = Math.round(+new Date() / 1000);
    //define testrail ID
    it('(C7355) Create a new private folder');

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.click('Add new address book');
    I.fillField('[name=name]', 'C7354 ' + timestamp);
    I.click('[data-action="add"]');
    I.waitForElement('.fa-spin-paused');
    I.see('C7354 ' + timestamp);
    I.logout();
});

Scenario('C7356 - Create a new public folder', function (I) {
    var timestamp = Math.round(+new Date() / 1000);
    //define testrail ID
    it('(C7356) Create a new public folder');

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.click('Add new address book');
    I.fillField('[name=name]', 'C7356 ' + timestamp);
    I.click('[data-action="add"]');
    I.waitForElement('.fa-spin-paused');
    I.see('C7356 ' + timestamp);

    // TODO : HOW?!
    //*[@id="folder-tree-324-node-807"]/div/div[3]/div
    //pause();
    //I.see('C7356 '+timestamp, '//*[@data-contextmenu-id="virtual/flat/contacts/public"]/ul/li/div/div[3]/div');
    //I.see(locate('[data-model="flat/contacts/public"][role="presentation"]').withText('C7356 '+timestamp));
    //locate('[role=presentation]').withText('C7356 '+timestamp).inside('[data-contextmenu-id="virtual/flat/contacts/public"]');
    I.logout();
});

Scenario('C7367 - Delete Contact', function (I) {
    //define testrail ID
    it('(C7367) Delete Contact');

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
    I.click('Add contact');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('First name', 'C7367');
    I.fillField('Last name', 'C7367');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.click('Delete');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.dontSee('C7367, C7367');
    I.logout();
});

Scenario('C7366 - Delete multiple contacts', async function (I, search, users) {
    let testrailID = 'C7366';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.getDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID

    };
    it('(C7366) Delete multiple contacts');
    I.createContact(contact, { user: users[0] });
    I.createContact(contact, { user: users[0] });
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    search.doSearch(testrailID + ' ' + testrailID);
    //pause();
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.fa-spin-paused');
    I.pressKey(['Control', 'a']);
    I.waitForElement('.fa-spin-paused');
    I.clickToolbar('Delete');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.dontSee('C7367, C7367');

    I.logout();
});

Scenario('C7369 - Search by Name', async function (I, search, users) {
    //define testrail ID
    it('(C7369) Search by Name');
    //var firstname = "C7369"
    //var lastname = "C7369"
    let testrailID = 'C7369';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.getDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID
    };
    I.createContact(contact, { user: users[0] });

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
    //pause();
    I.logout();
});

Scenario('C7370 - Search by Phone numbers', async function (I, search, users) {
    it('(C7370) Search by Phone numbers');
    let phone = '+4917113371337';
    let testrailID = 'C7370';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.getDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    I.createContact(contact, { user: users[0] });

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
    //pause();
    I.logout();
});

Scenario('C7371 - Search by Addresses', async function (I, search, users) {
    //define testrail ID
    it('(C7371) Search by Addresses');
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
        folder_id: await I.getDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone,
        street_home: street_home,
        post_code_home: post_code_home,
        city_home: city_home,
        state_home: state_home,
        country_home: country_home
    };
    I.createContact(contact, { user: users[0] });

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
    I.logout();
});

Scenario('C7359 - Expand/collapse all contact edit sections', function (I) {
    //define testrail ID
    it('(C7359) Expand/collapse all contact edit sections');

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
    //pause();

    I.logout();
});

Scenario('C7358 - Remove contact picture', function (I, search) {
    //define testrail ID
    it('(C7358) Remove contact picture');
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
    I.see('Upload image');
    I.click('.contact-picture-upload');
    I.waitForText('Edit image');
    I.attachFile('.picture-upload-view input[type=file]', 'contact_picture.png');
    I.click('Ok');
    I.waitForDetached('.modal-dialog');
    I.dontSee('Upload image');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    search.doSearch(lastname + ' ' + firstname);
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    I.doubleClick('[aria-label="' + lastname + ', ' + firstname + '"]');
    I.dontSee('Upload image');
    I.click('.detail-view-app [data-action="edit"]');
    I.dontSee('Upload image');
    I.click(".edit-contact [title='Remove']");
    I.see('Upload image');
    I.click('Save');
    I.see('Upload image');
    I.logout();
});

Scenario('C7363 - Add files to a contact', function (I, search) {
    //define testrail ID
    it('(C7363) Add files to a contact');
    var firstname = 'C7363';
    var lastname = 'C7363';
    var phone = '+4917113371337';

    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    I.clickToolbar('New');
    I.waitForElement('.fa-spin-paused');
    I.click('Add contact');
    I.waitForElement('.fa-spin-paused');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('First name', firstname);
    I.fillField('Last name', lastname);
    I.fillField('Cell phone', phone);
    I.attachFile('.contact_attachments_buttons input[type=file]', 'contact_picture.png');
    I.waitForElement('.fa-spin-paused');
    I.see('contact_picture.png');
    I.click('Save');
    I.waitForElement('.fa-spin-paused');
    I.waitForDetached('.io-ox-contacts-edit-window');

    search.doSearch(lastname + ' ' + firstname);
    //I.fillField('Search...', lastname+', '+firstname)
    //I.wait(1)
    //I.pressKey("Enter");
    //I.waitForElement('.fa-spin-paused');
    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong');
    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span');
    I.doubleClick('[aria-label="' + lastname + ', ' + firstname + '"]');
    I.waitForElement('.fa-spin-paused');
    I.see('contact_picture.png');

    I.logout();
});

//Scenario('C208266 - Export single contact', function (I) {
//    //define testrail ID
//    it('(C208266) Export single contact');
//    var firstname = "C208266"
//    var lastname = "C208266"
//    var phone = "+4917113371337"
//
//    I.login('app=io.ox/contacts');
//    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
//
//    I.waitForVisible('.classic-toolbar [data-action]');
//    I.selectFolder('Contacts');
//    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
//    I.clickToolbar('New');
//    I.click('Add contact');
//    I.waitForVisible('.io-ox-contacts-edit-window');
//    I.fillField('First name', firstname);
//    I.fillField('Last name', lastname);
//    I.fillField('Cell phone', phone);
//    I.click('Save');
//    I.waitForDetached('.io-ox-contacts-edit-window');
//
//    I.fillField('Search...', lastname+', '+firstname)
//    I.pressKey("Enter");
//    I.waitForElement('.fa-spin-paused');
//    I.see(lastname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > strong')
//    I.see(firstname, 'div.vgrid-cell.selectable.contact.even.selected > div.fullname > span > span')
//    I.doubleClick('[aria-label="'+lastname+', '+firstname+'"]');
//    I.click('.contact-detail .dropdown')
//    I.click('body > div.smart-dropdown-container.dropdown.open > ul > li:nth-child(1) > a')
//    I.click('body > div.modal.flex.maximize.export-dialog.in > div > div > div.modal-footer > button.btn.btn-primary')
//
//    I.logout();
//});

Scenario('C8817 - Send E-Mail to contact', function (I, users, search) {
    let [user] = users;
    //define testrail ID
    it('(C8817) Send E-Mail to contact');
    var testrailID = 'C8817';
    //var text = Math.round(+new Date() / 1000);
    var subject = Math.round(+new Date() / 1000);
    // 0) log in to settings and set compose mode to html
    I.login('app=io.ox/settings', { user });
    I.waitForVisible('.io-ox-settings-main');
    // open mail settings
    I.selectFolder('Mail');
    I.waitForVisible('.rightside h1');
    I.selectFolder('Compose');
    // set compose mode to html
    I.waitForVisible('[name="messageFormat"][value="text"] + i');
    I.checkOption({ css: '[name="messageFormat"][value="text"] + i' });
    I.openApp('Address Book');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    search.doSearch(users[1].userdata.primaryEmail);
    I.click('[href="mailto:' + users[1].userdata.primaryEmail + '"]');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + subject);
    //I.wait(0.5)
    //I.seeInField('.io-ox-mail-compose [name="subject"]', '' + testrailID + " - " + subject);
    I.fillField({ css: 'textarea.plain-text' }, testrailID);
    //I.seeInField({ css: 'textarea.plain-text' }, testrailID);
    I.click('Send');
    I.waitForElement('.fa-spin-paused');
    I.wait('1');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForText('' + testrailID + ' - ' + subject, 5, '.subject');
    I.doubleClick('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.see(testrailID + ' - ' + subject);
    I.see(testrailID);
    I.logout();
});

Scenario('C273805 - Download infected file', async function (I, users, search) {
    //TODO:Check for antivirus capability before testrun
    //let [user] = users;
    //define testrail ID
    it('(C273805) Download infected file');
    var testrailID = 'C273805';
    //var text = Math.round(+new Date()/1000);
    //var subject = Math.round(+new Date()/1000);
    // 0) log in to settings and set compose mode to html
    let default_folder = await I.getDefaultFolder('contacts', { user: users[0] });
    //Import Contact
    I.importContact({ user: users[0] }, default_folder, 'e2e/tests/testrail/files/contact/C273805 C273805.vcf');
    //Do search of given contact and get folderID and UUID of contact
    let attachment =  await I.getContact({ user: users[0] }, 'C273805', 'C273805');
    //Add infected attachment to contact
    I.addAttachment({ user: users[0] }, 'e2e/tests/testrail/files/virus/eicar.txt', '7', attachment[0].folder, attachment[0].id);
    //console.log(addAttachment);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');

    search.doSearch(testrailID + ' ' + testrailID);
    I.click('.contact[aria-label*="' + testrailID + ', ' + testrailID + '"]');
    I.click('eicar.txt');
    I.click('Download');
    //pause();
    I.seeElement('.modal-open [data-point="io.ox/core/download/antiviruspopup"] .alert-danger');
    I.click('Cancel');
    I.logout();
});
