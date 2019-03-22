/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Contacts: Create new contact').tag('6');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('adds a contact with all fields', function (I) {
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForText('My address books');
    I.doubleClick('~My address books');
    I.click('~Contacts');
    I.waitForDetached('.classic-toolbar [data-dropdown="io.ox/contacts/toolbar/new"].disabled');
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

    I.logout();
});
