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

const { expect } = require('chai');

Feature('Mail Compose');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

function createMails() {
    const { I, mail } = inject();
    // draft
    mail.newMail();
    I.fillField('Subject', 'to be edited');
    within('.io-ox-mail-compose-window', () => {
        I.waitForEnabled('[data-extension-id="composetoolbar-menu"]');
        I.click('[data-extension-id="composetoolbar-menu"]');
    });
    I.clickDropdown('Save draft and close');
    // active space
    mail.newMail();
    I.fillField('Subject', 'to be restored');
    I.waitForText('Saved a few seconds ago', 5, '.window-footer .inline-yell');
}

function checkSenderDropdown(name, address) {
    const { I } = inject();
    const node = locate('.active .io-ox-mail-compose').as('compose window');
    const toggle = node.find('[data-dropdown="from"]>a').as('sender dropdown toggle');
    const dropdown = locate('.smart-dropdown-container').as('sender dropdown');
    I.waitForVisible(node.find('.mail-input').withText(name ? name : '').as('sender'));
    I.wait(0.5);
    I.waitForVisible(toggle);
    I.click(toggle);
    I.waitForVisible(dropdown);
    I.waitForVisible(dropdown.find(`a[data-name="from"][data-value*="${name ? name : 'null'}"]`).as('node with name value'));
    I.waitForVisible(dropdown.find(`a[data-name="from"][data-value*="${address}"]`).as('node with mail value'));
    I.waitForElement(dropdown.find('.name').withText(name ? name : ''));
    I.waitForElement(dropdown.find('.address').withText(name ? `<${address}>` : address));
    I.pressKey('Escape');
    I.waitForDetached(dropdown);
}

async function checkModels(name, address, options) {
    const { I } = inject();
    var opt = Object.assign({ length: 3 }, options);
    var list = await I.executeScript(function () {
        return ox.ui.apps.where({ name: 'io.ox/mail/compose' }).map(function (app) {
            return app.view.model.get('from');
        });
    });
    expect(list).to.be.an('array').to.have.lengthOf(opt.length);
    list.forEach((array) => {
        expect(JSON.stringify(array)).to.be.equal(JSON.stringify([name ? name : null, address]));
    });
}

// [OXUIB-142]
Scenario('Compose windows uses latest mail account name', async ({ I, users, mail }) => {
    let [user] = users;
    let address = users[0].userdata.primaryEmail;
    const customDisplayNames = {};
    customDisplayNames[`${user.get('primaryEmail')}`] = {
        name: `${user.get('given_name')} ${user.get('sur_name')}`,
        overwrite: false,
        defaultName: `${user.get('given_name')} ${user.get('sur_name')}`
    };
    await I.haveSetting({
        'io.ox/mail': {
            features: { registerProtocolHandler: false },
            customDisplayNames,
            sendDisplayName: true,
            didYouKnow: { saveOnCloseDontShowAgain: true }
        }
    });

    I.say('preparation');
    I.login('app=io.ox/mail');
    I.openApp('Mail');
    createMails();
    I.logout();

    let name = 'Cameron Tucker';
    I.say(`${name}: change accounts personal`);
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');
    I.waitForVisible('.settings-list-item a.action');
    I.waitForText('Edit', 5, '.settings-list-item');
    I.retry(5).click('Edit');
    I.fillField('Your name', name);
    I.click('Save');
    I.waitForVisible({ css: '.io-ox-alert' });
    I.click({ css: '.io-ox-alert' });

    // new mail
    I.say(`${name}: new mail`);
    I.openApp('Mail');
    mail.newMail();
    checkSenderDropdown(name, address);
    I.fillField('Subject', 'new mail');
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('.io-ox-mail-compose');

    // restored mail
    I.say(`${name}: restored mail`);
    I.waitForVisible('.taskbar-button[aria-label="Mail: to be restored"]');
    I.click('.taskbar-button[aria-label="Mail: to be restored"]');
    checkSenderDropdown(name, address);
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('.io-ox-mail-compose');

    // edited draft
    I.say(`${name}: edited draft`);
    I.selectFolder('Drafts');
    I.waitForElement('.list-item.selectable [title="to be edited"]');
    I.click('.list-item.selectable [title="to be edited"]');
    I.click('Edit copy');
    checkSenderDropdown(name, address);
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('.io-ox-mail-compose');

    I.say(`${name}: check models`);
    await checkModels(name, address, { length: 3 });

    // check loaded compose instances
    name = 'Fizbo';
    I.say(`${name}: change accounts personal`);
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/settings/accounts' });
    I.waitForText('Edit', 5, '.settings-list-item');
    I.retry(5).click('Edit');
    I.fillField('Your name', name);
    I.click('Save');
    I.waitForVisible({ css: '.io-ox-alert' });
    I.click({ css: '.io-ox-alert' });

    I.say(`${name}: new mail`);
    I.waitForVisible('.taskbar-button[aria-label="new mail"]');
    I.click('.taskbar-button[aria-label="new mail"]');
    checkSenderDropdown(name, address);
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('.io-ox-mail-compose');

    I.say(`${name}: restored mail`);
    I.waitForVisible('.taskbar-button[aria-label="to be restored"]');
    I.click('.taskbar-button[aria-label="to be restored"]');
    checkSenderDropdown(name, address);
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('.io-ox-mail-compose');

    I.say(`${name}: edited mail`);
    I.waitForVisible('.taskbar-button[aria-label="[Copy] to be edited"]');
    I.click('.taskbar-button[aria-label="[Copy] to be edited"]');
    checkSenderDropdown(name, address);
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('.io-ox-mail-compose');

    I.say(`${name}: check models`);
    await checkModels(name, address, { length: 3 });
});

Scenario('[C163026] Change from display name when sending a mail', async ({ I, users, mail, dialogs }) => {
    let [user] = users;
    const address = users[0].userdata.primaryEmail;
    let name = users[0].userdata.given_name + ' ' + users[0].userdata.sur_name;

    await I.haveSetting('io.ox/mail//messageFormat', 'text');

    I.login('app=io.ox/mail', { user });
    mail.waitForApp();
    mail.newMail();
    checkSenderDropdown(name, address);
    await checkModels(name, address, { length: 1 });

    // change custom name
    name = 'Gloria Pritchett';
    I.click('.io-ox-mail-compose [data-dropdown="from"]>a');
    I.waitForVisible('.dropdown.open [data-name="edit-real-names"]', 5);
    I.clickDropdown('Edit names');
    dialogs.waitForVisible();
    I.waitForVisible('.name-overwrite-view .checkbox input[type="checkbox"]', 5);
    I.click('.name-overwrite-view .checkbox input[type="checkbox"]', dialogs.locators.body);
    I.fillField('.modal-body input[title="Custom name"]', name);
    dialogs.clickButton('Edit');
    I.waitForDetached('.modal-dialog');

    // check custom name
    I.waitForText(name, 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .name');
    I.waitForText('<' + users[0].userdata.primaryEmail + '>', 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .address');
    checkSenderDropdown(name, address);
    await checkModels(name, address, { length: 1 });

    // disable "send names"
    name = null;
    I.click('.io-ox-mail-compose [data-dropdown="from"]>a');
    I.waitForVisible('.dropdown.open [data-name="edit-real-names"]', 5);
    I.click('.dropdown [data-name="sendDisplayName"]');
    I.waitForElement('.dropdown.open [data-value^="[null,"]');
    I.click('.dropdown [data-name="from"]');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .address');
    I.dontSee(name, '.io-ox-mail-compose .mail-compose-fields [aria-label="From"] .name');
    I.waitForText('This email just contains your email address as sender. Your real name is not used.', 5, '.io-ox-mail-compose .sender-realname .mail-input');
    checkSenderDropdown(name, address);
    await checkModels(name, address, { length: 1 });
});

