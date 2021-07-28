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

/// <reference path="../../steps.d.ts" />

Feature('Contacts > Edit');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7361] Edit partial data of a contact', async function ({ I, contacts }) {
    // ensure unchchanged field values are not affected
    const testrailID = 'C7361';

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
    contacts.waitForApp();
    contacts.selectContact(contact.display_name);

    I.clickToolbar('~Edit contact');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('cellular_telephone1', '+3913371337');
    I.fillField('street_home', '+3913371337');
    I.fillField('postal_code_home', '+3913371337');
    I.fillField('city_home', '+3913371337');
    I.fillField('state_home', '+3913371337');
    I.fillField('country_home', '+3913371337');
    I.click('Save');

    I.waitForText('+3913371337', 5, '.contact-detail');
});

Scenario('[C7362] Edit full data of a contact', async function ({ I, contacts }) {
    // ensure all fields are changed
    const testrailID = 'C7362';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: testrailID,
        street_home: testrailID,
        post_code_home: testrailID,
        city_home: testrailID,
        state_home: testrailID,
        country_home: testrailID
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(contact.display_name);

    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.waitForText(testrailID, undefined, '.contact-detail');
    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');

    //personal info
    I.fillField('First name', 'Richard');
    I.fillField('Last name', 'Petersen');
    contacts.addContactsField('personal', 'Title', 'Sir');
    contacts.addContactsField('personal', 'Middle name', 'Holger');
    contacts.addContactsField('personal', 'Suffix', 'Pro');
    contacts.addContactsField('personal', 'Date of birth');
    I.selectOption('month', 'May');
    I.selectOption('date', '4');
    I.selectOption('year', '1957');
    contacts.addContactsField('personal', 'URL', 'my.homepage.com');

    // job description
    I.fillField('Department', 'Frontend');
    I.fillField('Company', 'Open-Xchange');
    contacts.addContactsField('business', 'Profession', 'Developer');
    contacts.addContactsField('business', 'Position', 'Senior Developer');
    contacts.addContactsField('business', 'Room number', '101');

    // communication
    I.fillField('Email 1', 'email1@test');
    I.fillField('Cell phone', 'cell phone');
    contacts.addContactsField('communication', 'Email 2', 'email2@test');
    contacts.addContactsField('communication', 'Email 3', 'email3@test');
    contacts.addContactsField('communication', 'Instant Messenger 1', 'instantmessenger1');
    contacts.addContactsField('communication', 'Instant Messenger 2', 'instantmessenger2');

    // phone and fax
    contacts.addContactsField('communication', 'Cell phone (alt)', 'cell phone alt');
    contacts.addContactsField('communication', 'Phone (business)', 'phone business');
    contacts.addContactsField('communication', 'Phone (business alt)', 'phone business alt');
    contacts.addContactsField('communication', 'Phone (home)', 'phone home');
    contacts.addContactsField('communication', 'Phone (home alt)', 'phone home alt');
    contacts.addContactsField('communication', 'Phone (other)', 'phone other');
    contacts.addContactsField('communication', 'Fax', 'fax');
    contacts.addContactsField('communication', 'Fax (Home)', 'fax home');

    // edit home address
    I.fillField('street_home', 'Home Street');
    I.fillField('postal_code_home', '12345');
    I.fillField('city_home', 'Home City');
    I.fillField('state_home', 'Home State');
    I.fillField('country_home', 'Home County');

    // business address
    contacts.addContactsField('addresses', 'Business address');
    I.fillField('street_business', 'Business Street');
    I.fillField('postal_code_business', '23456');
    I.fillField('city_business', 'Business City');
    I.fillField('state_business', 'Business State');
    I.fillField('country_business', 'Business County');

    // other address
    contacts.addContactsField('addresses', 'Other address');
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

    // all updated?
    I.dontSee('testrailID');
});

Scenario('Client-side validation returns visual feedback', async function ({ I, contacts }) {
    //Create Contact
    const contact = {
        display_name: 'Dunphy, Phil',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: 'Phil',
        last_name: 'Dunphy'
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(contact.display_name);

    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.dontSee('This is an invalid email address');

    I.fillField('Email 1', 'email1@valid.com');
    I.fillField('Company', 'Dovecot');
    I.dontSee('This is an invalid email address');

    I.fillField('Email 1', 'email2-invalid');
    I.fillField('Company', 'Open-Xchange');
    I.see('This is an invalid email address');

    I.fillField('Email 1', 'email3@valid.com');
    I.fillField('Company', 'Dovecot');
    I.dontSee('This is an invalid email address');

    I.fillField('Email 1', 'email4-invalid');
    I.click('Save');

    I.wait(1);
    I.waitForElement('.io-ox-contacts-edit-window');
});

Scenario('[C7360] Discard modification', async function ({ I, contacts }) {
    const phone = '+4917113371337';
    const testrailID = 'C7360';
    const contact = {
        display_name: `${testrailID}, ${testrailID}`,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(contact.display_name);

    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    //confirm dirtycheck is working properly
    I.click('Discard');
    I.dontSeeElement('.modal-dialog');
    I.waitForDetached('.io-ox-contacts-edit-window');

    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('department', 'Holger');
    I.click('Discard');
    I.click('Discard changes');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.dontSee('Holger');
});

Scenario('[C7358] Remove contact picture', async function ({ I, search, contacts, dialogs }) {
    const expect = require('chai').expect;
    const testrailID = 'C7358';
    const phone = '+4917113371337';

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newContact();

    // fill fields
    I.fillField('First name', testrailID);
    I.fillField('Last name', testrailID);
    I.fillField('Cell phone', phone);

    // upload photo
    I.waitForVisible('.contact-photo-upload .contact-photo.empty');
    I.click('.contact-photo', '.io-ox-contacts-edit-window');

    dialogs.waitForVisible();
    I.waitForVisible('.edit-picture');
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    let image_contact = await I.grabCssPropertyFrom('.contact-photo-upload .contact-photo', 'backgroundImage');
    expect(Array.isArray(image_contact) ? image_contact[0] : image_contact).to.not.be.empty;
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');

    search.doSearch(testrailID + ' ' + testrailID);
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.contact-header');
    I.waitForText(testrailID + ', ' + testrailID, 5, '.contact-header .fullname');

    // remove contact photo
    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');

    I.click('.contact-photo', '.io-ox-contacts-edit-window');

    dialogs.waitForVisible();
    I.waitForVisible('.edit-picture');
    dialogs.clickButton('Remove photo');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    I.waitForElement('.contact-photo.empty');
    I.click('Save');

    I.waitForDetached('.io-ox-contacts-edit-window');

    // check in detail and list view
    I.waitForVisible('.leftside .contact-photo.empty');
    I.waitForVisible('.rightside .contact-photo.empty');
});

Scenario('[C7363] Add files to a contact', async function ({ I, contacts }) {
    const testrailID = 'C7363',
        display_name = testrailID + ', ' + testrailID;
    const contact = {
        display_name: display_name,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(display_name);
    I.clickToolbar('Edit');
    I.waitForVisible('[data-app-name="io.ox/contacts/edit"]');
    I.waitForEnabled({ css: 'input.file-input[type="file"]' });
    I.attachFile({ css: 'input.file-input[type="file"]' }, 'e2e/media/files/generic/contact_picture.png');
    I.waitForElement(locate().withText('contact_picture.png').inside('.attachment'));
    I.click('Save');
    I.waitForInvisible('[data-app-name="io.ox/contacts/edit"]');
    I.waitForNetworkTraffic();
    I.waitForText('contact_picture.png');
});
