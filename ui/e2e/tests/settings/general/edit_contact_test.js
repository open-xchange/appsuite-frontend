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

Feature('Settings > Basic');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C208269] Edit contact information @shaky', async (I, users) => {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    // wait for form (the button we're interesting in has no meta data)
    I.waitForElement('select[name="language"]');
    I.click('My contact data ...');
    // floating window opens
    I.waitForElement('.edit-contact');

    // expand all fields
    I.dontSeeElement('input[name="second_name"]');
    I.click('Show all fields');
    I.seeElement('input[name="second_name"]');

    var fields = [
        // no 'display_name' used cause end-users don't understand it (bug 27260)
        'title', 'first_name',
        'second_name', 'suffix', 'url',
        // // job
        'profession', 'position', 'department', 'company', 'room_number',
        // messaging
        'instant_messenger1', 'instant_messenger2',
        // phone
        'cellular_telephone1', 'cellular_telephone2',
        'telephone_business1', 'telephone_business2',
        'telephone_home1', 'telephone_home2',
        'telephone_other',
        'fax_business', 'fax_home',
        // home address
        'street_home', 'postal_code_home', 'city_home',
        'state_home', 'country_home',
        // business_address
        'street_business', 'postal_code_business',
        'city_business', 'state_business',
        'country_business',
        // other_address
        'street_other', 'postal_code_other', 'city_other',
        'state_other', 'country_other',
        // comment
        'note',
        // userfields (not all)
        'userfield01', 'userfield02', 'userfield03', 'userfield11', 'userfield20'
    ];

    // add picture
    I.attachFile('.contact-picture-upload input[type="file"]', 'e2e/media/images/ox_logo.png');
    I.waitForElement('.modal.edit-picture');
    I.click('button[data-action="apply"]');
    // takes an unknown moment until the image appears
    I.wait(1);
    let [rule] = await I.grabCssPropertyFrom('.picture-uploader.thumbnail', 'background-image');
    expect(rule).to.match(/^url\("data:image\/png;base64/);
    // last name
    let last_name = 'last_name_' + users[0].userdata.id;
    I.fillField('last_name', last_name);
    // birthday
    I.selectOption('date', '4');
    I.selectOption('month', '3');
    I.selectOption('year', '2019');
    // email
    I.fillField('email2', 'second@example.org');
    I.fillField('email3', 'third@example.org');
    // enter a value for every field
    fields.forEach(function (name) {
        I.fillField(name, name);
    });
    I.click('Save');
    I.waitForDetached('.edit-contact');

    // switch to address book
    I.openApp('Address Book');
    // wait for first element in the list
    // the list itself is not reliable, instead we wait for the detail view
    I.waitForElement('.contact-detail.view');
    // click on "L"
    let thumbIndex = locate('.thumb-index').withText('L');
    I.waitForElement(thumbIndex);
    I.click(thumbIndex);
    // click on item
    let listItem = locate('.vgrid-cell .last_name').withText(last_name);
    I.waitForElement(listItem);
    I.click(listItem);
    // check picture
    I.waitForElement(locate('.contact-detail h1 .last_name').withText(last_name));
    I.wait(1);
    [rule] = await I.grabCssPropertyFrom('.contact-header .picture', 'background-image');
    expect(rule).not.to.match(/fallback/);
    expect(rule).to.match(/^url\(/);
    // also check picture in topbar
    [rule] = await I.grabCssPropertyFrom('#io-ox-topbar-dropdown-icon .contact-picture', 'background-image');
    expect(rule).to.match(/^url\(/);
    // check all field values
    fields.forEach(function (name) {
        if (/^(first_name|last_name|url|note)$/.test(name)) return;
        // no union here (too slow)
        if (/telephone/.test(name)) I.seeElement('//dd/a[text()="' + name + '"]');
        else if (/street|postal|city|state|country/.test(name)) I.seeElement('//address[contains(text(), "' + name + '")]');

        else I.seeElement('//dd[text()="' + name + '"]');
    });

    // email
    I.seeElement('//dd/a[text()="' + users[0].userdata.email1 + '"]');
    I.seeElement('//dd/a[text()="second@example.org"]');
    I.seeElement('//dd/a[text()="third@example.org"]');
    // url
    I.seeElement('//dd/a[text()="http://url"]');
    // birthday
    I.seeElement('//dd[text()="4/4/2019"]');
    // note
    I.seeElement('//div[contains(@class, "comment") and text()="note"]');

    I.logout();
});
