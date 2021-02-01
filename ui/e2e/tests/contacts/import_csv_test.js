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

/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;
const moment = require('moment');

Feature('Contacts > Import');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C104269] Import App Suite CSV', async ({ I, contacts, dialogs }) => {
// this scenario also covers:
// [C104268] Import App Suite vCard
// [C104277] Import Outlook vCard
// [C104275] Import emClient vCard
// [C104294] Import Apple Contacts vCard
// [C104291] Import Thunderbird vCard
// [C104300] Import Outlook.com CSV
// [C104298] Import Google vCard
// [C104296] Import Yahoo vCard

    await I.haveSetting({ 'io.ox/contacts': { startInGlobalAddressbook: false } });
    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // do everything twice
    ['csv', 'vcf'].forEach(function (type) {

        // #1
        I.say('basic_contact:' + type);
        importCSV('basic_contact', type);
        selectListItem('Last Basic');

        var values = ['Title', 'Company', 'Department', 'Position', 'im1'];
        values.forEach(function (name) {
            I.seeElement({ xpath: '//dd[text()="' + name + '"]' });
        });

        var age = moment().diff('2016-01-01', 'years');
        I.seeElement({ xpath: `//dd[text()="1/1/2016 (Age: ${age})"]` });

        var links = ['123 phone-home', '123 cell', 'mail1@example.com', 'mail2@example.com'];
        links.forEach(function (name) {
            I.seeElement({ xpath: '//dd/a[text()="' + name + '"]' });
        });

        var addresses = ['Street Home', '12345', 'Town Home', 'State Home', 'Country Home'];
        addresses.forEach(function (name) {
            I.seeElement({ xpath: '//address[contains(text(), "' + name + '")]' });
        });

        // comment
        I.see('Comment\nwith\n\nsome\nlines!');
        deleteSelectedContacts();

        // #2
        I.say('folder_with_two_contacts:' + type);
        importCSV('folder_with_two_contacts', type);
        selectListItem('Contact');
        I.click('.select-all');
        deleteSelectedContacts();

        // #3
        I.say('folder_with_dlist:' + type);
        importCSV('folder_with_dlist', type);
        waitClick(locate('.vgrid-cell .fullname').withText('My list'));
        I.waitForElement(locate('.contact-detail h1.fullname').withText('My list'));
        I.see('Distribution list with 2 entries');
        I.see('martin.heiland@open-xchange.com');
        I.see('markus.wagner@open-xchange.com');
        I.click('.select-all');
        deleteSelectedContacts();
    });

    //
    // [C104277] Import Outlook vCard
    //
    I.say('[C104277] Import Outlook vCard');
    importCSV('outlook_2013_en', 'vcf');
    selectListItem('Wurst');
    I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
    await hasContactImage();
    I.see('Boss', { css: 'dd' });
    I.see('Open-Xchange GmbH', { css: 'dd' });
    I.see('+49 1111 111111', { css: 'dd a' });
    I.see('+49 2222 222222', { css: 'dd a' });
    I.see('foo@example.com', { css: 'dd a' });
    deleteSelectedContacts();

    //
    // [C104275] Import emClient vCard
    //
    I.say('[C104275] Import emClient vCard');
    importCSV('emclient_7', 'vcf');
    selectListItem('Wurst');
    I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
    await hasContactImage();
    I.see('Cheffe', { css: 'dd' });
    I.see('Meine Notizen\n\nÜberall umbrüche', { css: '.note' });
    I.see('Open-Xchange GmbH', { css: 'dd' });
    I.see('+49 1111 111111', { css: 'dd a' });
    I.see('ox@example.com', { css: 'dd a' });
    I.see('Bei Der Arbeit 14\n1337 Berlin\nÄgypten', { css: 'address' });

    deleteSelectedContacts();

    //
    // [C104278] Import Outlook CSV
    //
    I.say('[C104278] Import Outlook CSV');
    ['en', 'de'].forEach(function (lang) {
        importCSV('outlook_2013_' + lang, 'csv');
        selectListItem('Wurst');
        I.see('Mr.', { css: 'dd' });
        I.see('12/14/2016', { css: 'dd' });
        I.see('Boss', { css: 'dd' });
        I.see('IT', { css: 'dd' });
        I.see('Open-Xchange GmbH', { css: 'dd' });
        I.see('Tester', { css: 'dd' });
        I.see('+49 1111 111111', { css: 'dd a' });
        I.see('+49 2222 222222', { css: 'dd a' });
        I.see('foo@example.com', { css: 'dd a' });
        deleteSelectedContacts();
    });

    //
    // [C104294] Import Apple Contacts vCard
    //
    I.say('[C104294] Import Apple Contacts vCard');
    for (const suffix of ['contact', 'contacts']) {
        importCSV('macos_1011_' + suffix, 'vcf');
        selectListItem('Wurst');
        I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
        await hasContactImage();
        I.see('1/1/2016', { css: 'dd' });
        I.see('+49 111 11111', { css: 'dd a' });
        I.see('foo@example.com', { css: 'dd a' });
        I.see('work@example.com', { css: 'dd a' });
        I.see('Home Street 23\nCity Home 12345\nCountry Home', { css: 'address' });
        I.see('Workstreet 43\nSomewhere 424242\nWorkcountry', { css: 'address' });
        I.see('Some notes\n\nwith linebreakös\n!!!', { css: '.note' });
        // delete on first iteration
        if (suffix === 'contact') deleteSelectedContacts();
    }

    // check other contact
    selectListItem('Person');
    I.waitForElement(locate('.contact-detail h1 .last_name').withText('Person'));
    I.see('+23 232323', { css: 'dd a' });
    I.click('.select-all');
    deleteSelectedContacts();

    //
    // [C104291] Import Thunderbird vCard
    //
    I.say('[C104291] Import Thunderbird vCard');
    for (const suffix of ['contact', 'contacts']) {
        importCSV('thunderbird_45_' + suffix, 'vcf');
        selectListItem('Wurst');
        I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
        I.see('Boss', { css: 'dd' });
        I.see('IT', { css: 'dd' });
        I.see('Orga', { css: 'dd' });
        I.see('hans@example.com', { css: 'dd a' });
        I.see('+49 111 1111', { css: 'dd a' });
        I.see('+49 222 2222', { css: 'dd a' });
        // delete on first iteration
        if (suffix === 'contact') deleteSelectedContacts();
    }

    // check other contacts
    // #1
    selectListItem('Some Guy', '.first_name');
    I.waitForElement(locate('.contact-detail h1 .first_name').withText('Some Guy'));
    // #2
    selectListItem('foo@example.com', '.display_name');
    I.waitForElement(locate('.contact-detail h1 .display_name').withText('foo@example.com'));
    // #3
    selectListItem('bar@example.com', '.display_name');
    I.waitForElement(locate('.contact-detail h1 .display_name').withText('bar@example.com'));
    I.click('.select-all');
    deleteSelectedContacts();

    //
    // [C104300] Import Outlook.com CSV
    //
    I.say('[C104300] Import Outlook.com CSV');
    // cities are not imported properly therefore US fallback (mw bug 67638)
    for (const suffix of ['contact', 'contacts']) {
        importCSV('outlookcom_2016_' + suffix, 'csv');
        selectListItem('Wurst');
        I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
        I.see('Some notes\n\nFor Hans', { css: '.note' });
        I.see('hans@example.com', { css: 'dd a' });
        I.see('+11 111 1111', { css: 'dd a' });
        I.see('Business St. 23\n13370 Berlin', { css: 'address' });
        I.see('Homestreet 23\nHometown NRW 44135', { css: 'address' });
        // delete on first iteration
        if (suffix === 'contact') deleteSelectedContacts();
    }

    selectListItem('Person');
    I.waitForElement(locate('.contact-detail h1 .last_name').withText('Person'));
    I.see('foo@bar.example.com', { css: 'dd a' });
    I.click('.select-all');
    deleteSelectedContacts();

    //
    // [C104298] Import Google vCard
    //
    I.say('[C104298] Import Google vCard');
    for (const suffix of ['contact', 'contacts']) {
        importCSV('google_2016_' + suffix, 'vcf');
        selectListItem('Wurst');
        I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
        I.see('Some notes for\n\nHans Würst!', { css: '.note' });
        I.see('Boss', { css: 'dd' });
        I.see('Open-Xchange GmbH', { css: 'dd' });
        I.see('bar@example.com', { css: 'dd a' });
        I.see('foo@example.com', { css: 'dd a' });
        I.see('Work 52, Workabily 23', { css: 'address' });
        I.see('Homeaddress 23, 12345 Sometown', { css: 'address' });
        // delete on first iteration
        if (suffix === 'contact') deleteSelectedContacts();
    }

    selectListItem('Other');
    I.waitForElement(locate('.contact-detail h1 .last_name').withText('Other'));
    I.see('some@body.example.com', { css: 'dd a' });
    I.click('.select-all');
    deleteSelectedContacts();

    //
    // [C104296] Import Yahoo vCard
    //
    I.say('[C104296] Import Yahoo vCard');
    for (const suffix of ['contact', 'contacts']) {
        importCSV('yahoo_2016_' + suffix, 'vcf');
        selectListItem('Wurst');
        I.waitForElement(locate('.contact-detail h1 .last_name').withText('Wurst'));
        I.see('Some notes\n\nfor this contäct!', { css: '.note' });
        I.see('Cheffe', { css: 'dd' });
        I.see('Open-Xchange', { css: 'dd' });
        I.see('hans@example.com', { css: 'dd a' });
        I.see('+49 111 1111', { css: 'dd a' });
        // delete on first iteration
        if (suffix === 'contact') deleteSelectedContacts();
    }

    selectListItem('Karlo');
    I.waitForElement(locate('.contact-detail h1 .last_name').withText('Karlo'));
    I.click('.select-all');
    deleteSelectedContacts();

    // ------------------------------------------------------------------

    function importCSV(file, type) {
        I.click('.folder-options.contextmenu-control');
        I.clickDropdown('Import');
        dialogs.waitForVisible();
        I.selectOption('Format', type === 'csv' ? 'CSV' : 'VCARD');
        I.attachFile('.file-input', 'e2e/media/imports/contacts/' + file + '.' + type);
        // click('Import') -> element not interactable
        dialogs.clickButton('Import');
        I.waitForDetached('.modal-dialog');
        I.waitForText('Data imported successfully');
    }

    function selectListItem(text, selector) {
        selector = selector || '.last_name';
        waitClick(locate('.vgrid-cell ' + selector).withText(text));
        I.waitForElement(locate('.contact-detail h1 ' + selector).withText(text));
    }

    function waitClick(arg) {
        I.waitForElement(arg);
        I.click(arg);
    }

    function deleteSelectedContacts() {
        I.clickToolbar('Delete');
        dialogs.waitForVisible();
        dialogs.clickButton('Delete');
        I.waitForDetached('.modal-dialog');
        I.waitForDetached('.vgrid-cell');
    }

    async function hasContactImage() {
        I.wait(1);
        var rule = await I.grabCssPropertyFrom('.contact-header .contact-photo', 'backgroundImage');
        rule = Array.isArray(rule) ? rule[0] : rule;
        expect(rule).not.to.match(/fallback/);
        expect(rule).to.match(/^url\(/);
    }
});
