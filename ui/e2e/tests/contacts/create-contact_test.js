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

Feature('Contacts > Create');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7354] With all available fields filled', function (I) {
    function addContactsField(fieldType, field, input) {
        I.click({ css: `div.dropdown[data-add="${fieldType}"] button` }, '.contact-edit');
        //I.click(`Add ${fieldType}`);
        I.waitForVisible('.dropdown-menu');
        I.click(field);
        I.waitForText(field, undefined, '.contact-edit');
        if (input) I.pressKey(input);
        I.wait(0.5);
    }

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

    //personal info
    I.fillField('First name', 'Richard');
    I.fillField('Last name', 'Petersen');
    addContactsField('personal', 'Title', 'Sir');
    addContactsField('personal', 'Middle name', 'Holger');
    addContactsField('personal', 'Suffix', 'Pro');
    addContactsField('personal', 'Birthday');
    I.selectOption('month', 'May');
    I.selectOption('date', '4');
    I.selectOption('year', '1957');
    addContactsField('personal', 'URL', 'my.homepage.com');

    // job description
    I.fillField('Department', 'Frontend');
    I.fillField('Company', 'Open-Xchange');
    addContactsField('business', 'Profession', 'Developer');
    addContactsField('business', 'Position', 'Senior Developer');
    addContactsField('business', 'Room number', '101');

    // communication
    I.fillField('Email 1', 'email1@test');
    I.fillField('Cell phone', 'cell phone');
    addContactsField('communication', 'Email 2', 'email2@test');
    addContactsField('communication', 'Email 3', 'email3@test');
    addContactsField('communication', 'Instant Messenger 1', 'instantmessenger1');
    addContactsField('communication', 'Instant Messenger 2', 'instantmessenger2');

    // phone and fax
    addContactsField('communication', 'Cell phone (alt)', 'cell phone alt');
    addContactsField('communication', 'Phone (business)', 'phone business');
    addContactsField('communication', 'Phone (business alt)', 'phone business alt');
    addContactsField('communication', 'Phone (home)', 'phone home');
    addContactsField('communication', 'Phone (home alt)', 'phone home alt');
    addContactsField('communication', 'Phone (other)', 'phone other');
    addContactsField('communication', 'Fax', 'fax');
    addContactsField('communication', 'Fax (Home)', 'fax home');

    // home address
    addContactsField('other', 'Home address');
    I.fillField('street_home', 'Home Street');
    I.fillField('postal_code_home', '12345');
    I.fillField('city_home', 'Home City');
    I.fillField('state_home', 'Home State');
    I.fillField('country_home', 'Home County');

    // business address
    addContactsField('other', 'Business address');
    I.fillField('street_business', 'Business Street');
    I.fillField('postal_code_business', '23456');
    I.fillField('city_business', 'Business City');
    I.fillField('state_business', 'Business State');
    I.fillField('country_business', 'Business County');

    // other address
    addContactsField('other', 'Other address');
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

Scenario('Dirtycheck on creating contact', function (I) {

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

    I.click('Discard');
    I.dontSeeElement('.modal-dialog');
});
