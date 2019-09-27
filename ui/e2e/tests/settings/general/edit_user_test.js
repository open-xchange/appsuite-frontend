/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Settings > Basic > User');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C208269] Edit users contact information @shaky', async (I) => {

    function addContactsField(fieldType, field, input) {
        I.click({ css: `div.dropdown[data-add="${fieldType}"] button` }, '.contact-edit');
        //I.click(`Add ${fieldType}`);
        I.waitForVisible('.dropdown-menu');
        I.click(field);
        I.waitForText(field, undefined, '.contact-edit');
        if (input) I.pressKey(input);
        I.wait(0.5);
    }

    var lastname = `C208269-${Math.round(+new Date() / 1000)}`;

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    // wait for form (the button we're interesting in has no meta data)
    I.waitForElement('select[name="language"]');
    I.click('My contact data ...');
    // floating window opens
    I.waitForElement('.contact-edit');

    // expand field
    I.dontSee('Middle name');
    addContactsField('personal', 'Middle name', 'Holger');
    I.see('Middle name');

    //personal info
    I.fillField('First name', 'Richard');
    I.fillField('Last name', lastname);
    addContactsField('personal', 'Title', 'Sir');
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
    I.fillField('Cell phone', 'cell phone');
    var prop = await I.grabAttributeFrom('input[name="email1"]', 'readonly');
    expect(prop.toString()).to.contain('true');
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

    // add picture
    I.click('.contact-photo', '.io-ox-contacts-edit-window');
    I.waitForVisible('.edit-picture');
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/images/ox_logo.png');
    I.click('Apply');
    I.waitForDetached('.modal-dialog');
    // takes an unknown moment until the image appears
    I.wait(1);
    let [rule] = await I.grabCssPropertyFrom('.contact-photo-upload .contact-photo', 'background-image');
    I.wait(5);
    expect(rule).to.match(/^url\("data:image\/jpeg;base64/);

    I.click('Save', '.io-ox-contacts-edit-window');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.waitForElement('.fa-spin-paused');

    // switch to address book
    I.openApp('Address Book');
    // wait for first element in the list
    // the list itself is not reliable, instead we wait for the detail view
    I.waitForElement('.contact-detail.view');
    // click on "L"
    let thumbIndex = locate('.thumb-index').withText('P').as('Thumb index');

    I.waitForElement(thumbIndex);
    I.click(thumbIndex);

    // click on item
    let listItem = locate('.vgrid-cell .last_name').withText(lastname).as('List item');
    I.waitForElement(listItem);
    I.click(listItem);

    // check picture
    I.waitForElement(locate('.contact-detail h1 .last_name').withText(lastname).as('Detail view heading'));
    I.wait(1);
    [rule] = await I.grabCssPropertyFrom('.contact-photo', 'background-image');
    expect(rule).not.to.match(/fallback/);
    expect(rule).to.match(/^url\(/);
    // also check picture in topbar
    [rule] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(rule).to.match(/^url\(/);

    // personal information
    I.see('Sir');
    I.see('Richard');
    I.see(lastname);
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
