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

Feature('Contacts > Create');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7354] With all available fields filled', function ({ I, contacts }) {
    I.login('app=io.ox/contacts');

    contacts.waitForApp();
    contacts.newContact();

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

    // home address
    contacts.addContactsField('addresses', 'Home address');
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
});

Scenario('Dirtycheck on creating contact', function ({ I, contacts }) {

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newContact();
    I.click('Discard');
    I.dontSeeElement('.modal-dialog');
});
