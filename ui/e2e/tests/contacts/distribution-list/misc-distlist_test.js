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

Feature('Contacts > Distribution List > Misc');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const util = require('./util');

Scenario('Add external participant as contact', async function ({ I, contacts, dialogs }) {
    const haloview = locate({ css: '.io-ox-sidepopup .io-ox-halo' }).as('Halo View');

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.newDistributionlist();

    I.say('New distribution list');
    I.fillField('Name', 'Testlist');
    I.fillField('Add contact', 'test@tester.com');
    I.pressKey('Enter');

    I.say('Open halo view');
    I.waitForVisible('a.halo-link');
    I.click('a.halo-link');
    I.waitForVisible(haloview);
    await within(haloview, async () => {
        I.waitForVisible({ css: '[data-action="io.ox/contacts/actions/add-to-contactlist"]' });
        I.see('Add to address book');
        I.click('Add to address book');
    });

    I.say('New contact');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.waitForVisible({ css: '[name="last_name"]' });

    I.say('Check prefilled mail address');
    I.seeInField('Email 1', 'test@tester.com');

    I.say('Confirm dirtycheck is working properly');
    I.click('Discard', '.io-ox-contacts-edit-window');
    dialogs.waitForVisible();
    I.waitForText('Do you really want to discard your changes?', 5, dialogs.locators.body);
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    I.say('Save contact as `Lastname`');
    I.fillField('Last name', 'Lastname');
    I.click('Save', '.io-ox-contacts-edit-window');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.waitForText('Lastname', 5, haloview);

    I.say('Save to addressbook');
    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.click('Create list', '.io-ox-contacts-distrib-window');

    I.waitForDetached('.io-ox-contacts-distrib-window');
});

Scenario('[C7376] Send a mail to list', async function ({ I, users, contacts, mail }) {
    await users.create();
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    const testrailID = 'C7376',
        display_name = await util.createDistributionList(I, users, testrailID);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(display_name);

    I.waitForText(`Distribution list with ${users.length} entries`, 5, util.SUBTITLE_SELECTOR);
    users.forEach(function name(user) {
        I.see(user.userdata.primaryEmail, '.contact-detail');
    });
    I.clickToolbar('Send email');
    I.waitForFocus('.io-ox-mail-compose [placeholder="To"]');
    I.fillField('.io-ox-mail-compose [name="subject"]', display_name);
    I.fillField({ css: 'textarea.plain-text' }, display_name);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');

    users.forEach(function name(user) {
        I.logout();
        I.login('app=io.ox/mail', { user: user });
        I.selectFolder('Inbox');

        mail.selectMail(display_name);
        I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
        I.see(display_name, '.io-ox-mail-window .mail-detail-pane .subject');
    });
});
