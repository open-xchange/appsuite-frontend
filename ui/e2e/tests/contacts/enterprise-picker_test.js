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

/// <reference path="../../steps.d.ts" />

Feature('Contacts > Enterprise Picker');

const expect = require('chai').expect;

Before(async ({ I, users }) => {
    await users.create();
    await I.haveSetting({
        'io.ox/core': {
            features: {
                enterprisePicker: {
                    enabled: true,
                    showTopRightLauncher: true
                }
            }
        }
    });
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('appears in launcher menu', async function ({ I, contacts }) {
    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.seeElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForVisible('.launcher-dropdown');
    I.see('Address directory', '.launcher-dropdown');
});

Scenario('appears in quicklaunch menu', async function ({ I, contacts }) {
    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.rightClick('#io-ox-quicklaunch');
    I.waitForText('Position 3');
    I.selectOption('Position 3', 'Address directory');
    I.click('Save changes');

    I.waitForInvisible('.modal-dialog');
    var text = await I.grabHTMLFrom('#io-ox-quicklaunch button:last-child .title');
    expect(text).to.equal('Address directory');
});

Scenario('appears in topbar', async function ({ I, contacts }) {
    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.seeElement('#io-ox-enterprise-picker-icon');
});

Scenario('opens in floating window and has no selection', async function ({ I, contacts }) {
    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.waitForElement('#io-ox-enterprise-picker-icon');
    I.click('#io-ox-enterprise-picker-icon');

    I.waitForElement('.io-ox-contacts-enterprisepicker-window.floating-window');
    I.waitForText('Address list');
    I.selectOption('Address list', 'Global address book');
    I.waitForElement('.contact-list-view li');
    I.dontSeeElement('.contact-list-view .fa-checkmark');
});

Scenario('opens in modal dialog, has selection and can add a mail address to mail compose', async function ({ I, mail }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();

    I.waitForElement('.io-ox-mail-compose-window .open-addressbook-popup');
    I.click('.io-ox-mail-compose-window .open-addressbook-popup');

    I.waitForText('Search', 5, '.modal.enterprise-picker');
    I.fillField('Search', 'test');
    I.waitForElement('.contact-list-view li');
    I.click('.contact-list-view li');
    I.click('Select');

    I.waitForInvisible('.modal.enterprise-picker');
    I.seeElement('.io-ox-mail-compose-window .tokenfield.to .token');
});
