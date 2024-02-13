/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

Feature('Mail Compose');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// https://testrail.open-xchange.com/index.php?/cases/view/7382
// TODO: shaky, failed (10 runs on 2019-11-28)
Scenario.skip('Compose plain text mail', function ({ I, users, mail }) {
    const [user] = users;
    // 0) log in to settings and set compose mode to html
    I.login('app=io.ox/settings', { user });
    I.waitForVisible('.io-ox-settings-main');

    // open mail settings
    I.selectFolder('Mail');
    I.waitForVisible('.rightside h1');
    I.selectFolder('Compose');

    // set compose mode to html
    I.waitForText('HTML');
    I.checkOption('HTML');

    // 1) Switch to the mail app, select "Create mail"
    I.openApp('Mail');

    // 1.1) Mark all messages as read to identify the new message later on
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.click('.selected .contextmenu-control');
    I.click('.dropdown.open a[data-action="markfolderread"]');

    // 1.2) continue opening mail compose
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');

    // 2) Select "Plain Text" as text format under "Options"
    I.click(mail.locators.compose.options);
    I.click('Plain Text');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text');
    I.waitForInvisible('.io-ox-mail-compose .contenteditable-editor');

    // 3) Set a recipient, add a subject and mail text
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    // 4) Send the E-Mail and check it as recipient
    I.click('Send');
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread', 30);
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');

    // 4.1) Assert body content
    I.waitForElement('.mail-detail-frame');
    I.switchTo('.mail-detail-frame');
    I.see('Test text');
    I.switchTo();

    // 5) Check the "Sent" folder
    I.selectFolder('Sent objects');
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');

    // 5.1) Assert body content
    I.waitForElement('.mail-detail-frame');
    I.switchTo('.mail-detail-frame');
    I.see('Test text');
    I.switchTo();
});
