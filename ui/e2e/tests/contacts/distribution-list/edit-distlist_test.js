/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Contacts > Distribution List > Edit');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

var util = require('./util');

Scenario('Add an existing distribution list', async function ({ I, contacts, dialogs }) {
    const title = 'test distribution list one';

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // create new address book
    contacts.newAddressbook('test address book');

    // create distribution list
    let listenerID = I.registerNodeRemovalListener('.classic-toolbar');
    I.selectFolder('test address book');
    I.waitForNodeRemoval(listenerID);

    I.waitForText('Empty'); // Empty in list view
    contacts.newDistributionlist();

    I.fillField('Name', title);
    I.fillField('Add contact', 'testdude1@test.case');
    I.pressKey('Enter');
    I.fillField('Add contact', 'testdude2@test.case');
    I.pressKey('Enter');
    I.fillField('Add contact', 'testdude3@test.case');
    I.pressKey('Enter');
    I.fillField('Add contact', 'testdude4@test.case');
    I.pressKey('Enter');
    I.click('Create list');
    I.waitForDetached('.io-ox-contacts-distrib-window');
    I.waitForText(title, undefined, '.contact-detail');
    I.waitForVisible('.io-ox-alert');
    I.click('.close', '.io-ox-alert');

    // create second list
    contacts.newDistributionlist();
    I.fillField('Name', 'test distribution list two');

    // search in address book for distribution list one
    I.click('~Select contacts');
    dialogs.waitForVisible();
    I.waitForVisible({ css: '.modal-dialog .modal-header input.search-field' }, 5);
    I.waitForEnabled({ css: '.modal-dialog .modal-header input.search-field' }, 5); // search field disabled until list is loaded
    I.waitForFocus('.modal-header input.search-field'); // search field must be focused, otherwise marked string might be deleted
    I.fillField({ css: '.modal-dialog .modal-header input.search-field' }, title);
    I.waitForText(title, 5, '.modal li.list-item');
    I.click(title, '.modal li.list-item');
    I.waitForText('4 addresses selected', 5);
    I.see(title, 'li.token');

    dialogs.clickButton('Select');
    I.waitForDetached('.modal-dialog');

    // add another address just for good measurement
    I.fillField('Add contact', 'testdude5@test.case');
    I.wait(0.5);
    I.pressKey('Enter');
    I.waitNumberOfVisibleElements('li.participant-wrapper.removable', 5);

    I.see('testdude1@test.case');
    I.see('testdude2@test.case');
    I.see('testdude3@test.case');
    I.see('testdude4@test.case');
    I.see('testdude5@test.case');

    I.click('Create list');
    I.waitForDetached('.io-ox-contacts-distrib-window', 5);

    I.see('test distribution list two');
});

Scenario('[C7373] Update members', async function ({ I, users, contacts }) {
    await Promise.all([
        users.create(),
        users.create()
    ]);

    const display_name = await util.createDistributionList(I, users, 'C7373');

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // check preconditon
    contacts.selectContact(display_name);
    I.waitForText(display_name, 5, util.TITLE_SELECTOR);
    I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.waitForElement('.contact-detail .participant-email [href="mailto:' + user.userdata.primaryEmail + '"]');
    });
    // add 5th contact
    I.clickToolbar('Edit');
    I.waitForElement('.form-control.add-participant.tt-input');
    I.fillField('.form-control.add-participant.tt-input', 'john.doe@open-xchange.com');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForDetached('.floating-window');
    I.waitForText('Distribution list has been saved');
    I.waitForDetached('.io-ox-alert');
    // check
    I.waitForText(display_name, 5, util.TITLE_SELECTOR);
    I.waitForText(`Distribution list with ${users.length + 1} entries`, 5, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.waitForElement('.contact-detail .participant-email [href="mailto:' + user.userdata.primaryEmail + '"]');
    });
    I.waitForElement('.contact-detail .participant-email [href="mailto:john.doe@open-xchange.com"]');

    // remove 1st contact
    I.clickToolbar('Edit');
    const removeButton = locate('.remove').after(locate('.participant-email a').withText(users[0].userdata.primaryEmail).inside('.removable')).as('remove button');
    I.waitForElement(removeButton);
    I.click(removeButton);
    I.click('Save');
    I.waitForDetached('.floating-window');
    I.waitForText('Distribution list has been saved');
    I.waitForDetached('.io-ox-alert');

    // check
    I.waitForText(display_name, 5, util.TITLE_SELECTOR);
    I.waitForText(`Distribution list with ${users.length + 1 - 1} entries`, 5, util.SUBTITLE_SELECTOR);
    I.dontSeeElement('.contact-detail .participant-email [href="mailto:' + users[0].userdata.primaryEmail + '"]');
    I.dontSee(users[0].userdata.primaryEmail);
    for (let i = 1; i <= users.length - 1; i++) {
        I.waitForElement('.contact-detail .participant-email [href="mailto:' + users[i].userdata.primaryEmail + '"]');
        I.see(users[i].userdata.primaryEmail);
    }
    I.waitForElement('.contact-detail .participant-email [href="mailto:john.doe@open-xchange.com"]');
    I.see('john.doe@open-xchange.com');
});

Scenario('[C7374] Change name', async function ({ I, users, contacts }) {
    await users.create();
    const testrailID = 'C7374',
        display_name = await util.createDistributionList(I, users, testrailID),
        new_name = `${display_name} - ${testrailID}`;

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // check precondition
    contacts.selectContact(display_name);
    I.waitForText(display_name, 5, util.TITLE_SELECTOR);
    I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.see(user.userdata.primaryEmail);
    });
    // edit name
    I.clickToolbar('Edit');
    I.waitForElement({ css: '[name="display_name"]' });
    I.fillField({ css: '[name="display_name"]' }, new_name);
    I.click('Save');
    I.waitForDetached('.floating-window');
    I.waitForText('Distribution list has been saved');
    I.waitForDetached('.io-ox-alert');
    // select and check
    contacts.selectContact(new_name);
    I.waitForText(new_name, 5, util.TITLE_SELECTOR);
    I.see(`Distribution list with ${users.length} entries`, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.see(user.userdata.primaryEmail);
    });
});

Scenario('[C7375] Move list', async function ({ I, users, contacts, dialogs }) {
    await users.create();
    const testrailID = 'C7375',
        display_name = await util.createDistributionList(I, users, testrailID);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newAddressbook(testrailID);
    contacts.selectContact(display_name);
    I.clickToolbar('~More actions');
    I.click('Move');

    dialogs.waitForVisible();
    I.waitForText('Move', 5, dialogs.locators.header);
    I.waitForElement('.modal .section .folder-arrow');
    I.click('.modal .section .folder-arrow');
    I.waitForElement(`.modal .section.open [aria-label="${testrailID}"]`, 5);
    I.click(`.modal [aria-label="${testrailID}"]`);
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Contacts');
    I.waitForDetached(`~${display_name}`);
    I.selectFolder(testrailID);
    contacts.selectContact(display_name);
    I.waitForText(display_name, 5, util.TITLE_SELECTOR);
    I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);

    users.forEach(function name(user) {
        I.waitForElement('.contact-detail .participant-email [href="mailto:' + user.userdata.primaryEmail + '"]');
    });
});

Scenario('[C7377] Copy list', async function ({ I, users, contacts, dialogs }) {
    await users.create();
    const testrailID = 'C7377',
        display_name =  await util.createDistributionList(I, users, testrailID);

    I.login('app=io.ox/contacts');

    contacts.waitForApp();
    contacts.newAddressbook(testrailID);
    contacts.selectContact(display_name);

    I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.waitForElement('.contact-detail .participant-email [href="mailto:' + user.userdata.primaryEmail + '"]');
    });

    I.clickToolbar('~More actions');
    I.clickDropdown('Copy');
    dialogs.waitForVisible();
    I.waitForText('Copy', 5, dialogs.locators.header);
    I.waitForElement('.modal .section .folder-arrow');
    I.click('.modal .section .folder-arrow');
    I.waitForElement(`.modal .section.open [aria-label="${testrailID}"]`, 5);
    I.click(`.modal [aria-label="${testrailID}"]`);
    dialogs.clickButton('Copy');
    I.waitForDetached('.modal-dialog');

    ['Contacts', testrailID].forEach(function (folderName) {
        I.selectFolder(folderName);
        I.waitForElement(`~${display_name}`);
        I.retry(3).click(`~${display_name}`);
        I.waitForText(display_name, 5, util.TITLE_SELECTOR);
        I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);
        users.forEach(function name(user) {
            I.waitForElement('.contact-detail .participant-email [href="mailto:' + user.userdata.primaryEmail + '"]');
        });
    });
});
