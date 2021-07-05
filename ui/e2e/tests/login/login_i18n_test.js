/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../steps.d.ts" />

Feature('Login > Switch translations');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7338] on form login page', function ({ I }) {
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();
    I.waitForFocus('#io-ox-login-username', 30);
    I.click('English');
    I.click('Italiano');
    I.waitForText('Nome utente');
});

Scenario('[OXUI-700] for guest users with password', async ({ I, users, dialogs }) => {
    await users.create();
    I.login('app=io.ox/files');
    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    I.clickToolbar('Share');

    dialogs.waitForVisible();
    I.selectOption('.form-group select', 'Anyone with the link and invited people');
    I.waitForText('Anyone with the link and invited people');
    I.waitForText('Copy link');
    I.wait(0.2);
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    let link = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    I.waitForEnabled('.settings-button');
    I.click('.settings-button');
    dialogs.waitForVisible();
    I.fillField('Password', 'CorrectHorseBatteryStaple');
    dialogs.clickButton('Save');

    I.waitForText('Copy link');
    I.click('Copy link');
    I.waitForText('The link has been copied to the clipboard', 5, '.io-ox-alert');
    link = Array.isArray(link) ? link[0] : link;
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.logout();

    I.amOnPage(link.replace(/^https?:\/\/[^/]+\//, '../'));
    I.waitForFocus('#io-ox-login-password');
    I.click('#io-ox-languages .dropdown > a');
    I.click('Deutsch (Deutschland)');
    I.waitForText('hat den Ordner "Musik" für Sie freigegeben', 5);
    I.click('#io-ox-languages .dropdown > a');
    I.click('English (United States)');
    I.waitForText('has shared the folder "Music" with you', 5);
});
