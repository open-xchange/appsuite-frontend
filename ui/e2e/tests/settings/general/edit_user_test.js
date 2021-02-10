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

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario('[C208269] Edit users contact information', async ({ I, dialogs }) => {

    function addContactsField(fieldType, field, input) {
        I.click({ css: `.dropdown[data-add="${fieldType}"] button` }, '.contact-edit');
        //I.click(`Add ${fieldType}`);
        I.waitForVisible('.dropdown.open .dropdown-menu');
        I.click(field);
        I.waitForText(field, undefined, '.contact-edit');
        if (input) I.fillField(field, input);
        I.pressKey('Enter');
    }

    var lastname = `C208269-${Math.round(+new Date() / 1000)}`;

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    // wait for form (the button we're interesting in has no meta data)
    I.waitForElement({ css: 'select[name="language"]' });
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
    addContactsField('personal', 'Date of birth');
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
    var prop = await I.grabAttributeFrom({ css: 'input[name="email1"]' }, 'readonly');
    if (prop === 'readonly') prop = 'true';
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
    addContactsField('addresses', 'Home address');
    I.fillField('street_home', 'Home Street');
    I.fillField('postal_code_home', '12345');
    I.fillField('city_home', 'Home City');
    I.fillField('state_home', 'Home State');
    I.fillField('country_home', 'Home County');

    // business address
    addContactsField('addresses', 'Business address');
    I.fillField('street_business', 'Business Street');
    I.fillField('postal_code_business', '23456');
    I.fillField('city_business', 'Business City');
    I.fillField('state_business', 'Business State');
    I.fillField('country_business', 'Business County');

    // other address
    addContactsField('addresses', 'Other address');
    I.fillField('street_other', 'Other Street');
    I.fillField('postal_code_other', '34567');
    I.fillField('city_other', 'Other City');
    I.fillField('state_other', 'Other State');
    I.fillField('country_other', 'Other County');

    // coment
    I.fillField('note', 'a comment in the comment field');

    // add picture
    I.click('.contact-photo', '.io-ox-contacts-edit-window');
    dialogs.waitForVisible();
    I.waitForVisible('.edit-picture');
    I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/images/ox_logo.png');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    // takes an unknown moment until the image appears
    I.waitForVisible('.contact-photo-upload .contact-photo', 1);
    let image = await I.grabBackgroundImageFrom('.contact-photo-upload .contact-photo');
    expect(image).to.match(/^url\("data:image\/jpeg;base64/);

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
    I.waitForVisible('.contact-photo', 1);
    image = await I.grabBackgroundImageFrom('.contact-detail .contact-photo');
    expect(image).not.to.match(/fallback/);
    expect(image).to.match(/^url\(/);
    // also check picture in topbar
    image = await I.grabBackgroundImageFrom('#io-ox-topbar-account-dropdown-icon .contact-picture');
    expect(image).to.match(/^url\(/);

    // personal information
    I.see('Sir', '.contact-detail.view');
    I.see('Richard', '.contact-detail.view');
    I.see(lastname, '.contact-detail.view');
    I.see('Holger', '.contact-detail.view');
    I.see('Pro', '.contact-detail.view');
    I.see('5/4/1957', '.contact-detail.view');
    I.see('http://my.homepage.com', '.contact-detail.view');
    // job description
    I.see('Developer', '.contact-detail.view');
    I.see('Senior Developer', '.contact-detail.view');
    I.see('Frontend', '.contact-detail.view');
    I.see('Open-Xchange', '.contact-detail.view');
    I.see('101', '.contact-detail.view');
    // mail and messaging
    I.see('email2@test', '.contact-detail.view');
    I.see('email3@test', '.contact-detail.view');
    I.see('instantmessenger1', '.contact-detail.view');
    I.see('instantmessenger2', '.contact-detail.view');
    // phone numbers
    I.see('cell phone', '.contact-detail.view');
    I.see('cell phone alt', '.contact-detail.view');
    I.see('phone business', '.contact-detail.view');
    I.see('phone business alt', '.contact-detail.view');
    I.see('phone home', '.contact-detail.view');
    I.see('phone home alt', '.contact-detail.view');
    I.see('phone other', '.contact-detail.view');
    I.see('fax', '.contact-detail.view');
    I.see('fax home', '.contact-detail.view');
    // business address
    I.see('Business Street', '.contact-detail.view');
    I.see('Business City', '.contact-detail.view');
    I.see('Business State', '.contact-detail.view');
    I.see('12345', '.contact-detail.view');
    I.see('Business County', '.contact-detail.view');
    // home address
    I.see('Home Street', '.contact-detail.view');
    I.see('Home City', '.contact-detail.view');
    I.see('Home State', '.contact-detail.view');
    I.see('23456', '.contact-detail.view');
    I.see('Home County', '.contact-detail.view');
    // other address
    I.see('Other Street', '.contact-detail.view');
    I.see('Other City', '.contact-detail.view');
    I.see('Other State', '.contact-detail.view');
    I.see('34567', '.contact-detail.view');
    I.see('Other County', '.contact-detail.view');
    // comment
    I.see('a comment in the comment field', '.contact-detail.view');
});
