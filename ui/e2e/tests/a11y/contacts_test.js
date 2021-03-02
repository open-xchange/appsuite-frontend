/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Accessibility');

BeforeSuite(async function ({ users }) {
    await users.create();
});

AfterSuite(async function ({ users }) {
    await users.removeAll();
});

Scenario('Contacts - List view w/o contact', async ({ I, contacts }) => {
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForElement('.summary.empty');
    I.waitForText('Empty');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Contacts - List view with contact detail view', async ({ I }) => {
    I.login('app=io.ox/contacts');
    I.waitForElement('.contact-detail');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Contacts - Modal Dialog - New address book (with exceptions)', async ({ I, contacts }) => {
    // Exceptions:
    // Input field has a missing label (critical)
    const excludes = { exclude: [['input[name="name"]']] };

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.click('Add new address book');
    I.clickDropdown('Personal address book');
    I.waitForText('Add as public folder');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});

Scenario('Contacts - Modal Dialog - Import', async ({ I, contacts, dialogs }) => {

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.click('.folder-arrow', '~My address books');
    I.openFolderMenu('Contacts');
    I.clickDropdown('Import');
    dialogs.waitForVisible();

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Contacts - Modal Dialog - Create sharing link (with exceptions)', async ({ I, contacts }) => {
    // Exceptions:
    // Typeahead missing label (critical)
    // Textinput, password and textarea have missing visual labels (critical)
    const excludes = { exclude: [
        ['.tt-hint'], ['.tt-input'],
        ['[placeholder="Password"]'],
        ['[placeholder="Message (optional)"]'],
        ['input[type="text"].form-control']
    ] };

    const defaultFolder = await I.grabDefaultFolder('contacts');

    await I.haveFolder({
        title: 'Krawall',
        module: 'contacts',
        parent: defaultFolder
    });
    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.waitForElement(locate('.folder-arrow').inside('~My address books').as('My address books folder arrow'));
    I.click('.folder-arrow', '~My address books');
    I.waitForText('Krawall');
    I.click('Krawall');
    I.openFolderMenu('Krawall');
    I.clickDropdown('Create sharing link');
    I.waitForText('Sharing link created for folder');
    I.waitForFocus('.share-wizard .link-group input[type="text"]');

    I.say('Axe report');
    expect(await I.grabAxeReport(excludes)).to.be.accessible;

    I.say('Cleanup');
    I.click('Remove link');
    I.waitForText('The link has been removed');

});

Scenario('Contacts - New contact window', async ({ I, contacts }) => {

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newContact();

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Contacts - New distribution list window (with exceptions)', async ({ I, contacts }) => {
    // Exceptions:
    // Typeahead missing label (critical)
    const excludes = { exclude: [['.tt-hint'], ['.tt-input']] };

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newDistributionlist();

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});
