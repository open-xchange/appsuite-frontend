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

Feature('Mail Compose');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Spaces', async ({ I, mail, dialogs }) => {
    // Log in and navigate to mail app
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    I.login('app=io.ox/mail');

    // Open Compose
    mail.waitForApp();
    I.say('create: restored-minimized');
    mail.newMail();
    I.fillField('Subject', 'restored-minimized');
    I.pressKey('Tab');
    I.pressKeys('some user input');
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('io-ox-mail-compose-window.active');

    // I.say('create: restored-maximized');
    // mail.newMail();
    // I.fillField({ css: '.active .mail-input input[name="subject"]' }, 'restored-maximized');
    // I.click(mail.locators.compose.minimize);
    // I.waitForInvisible('io-ox-mail-compose-window.active');

    I.logout();
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.selectFolder('Drafts');

    I.say('create: new-minimized');
    mail.newMail();
    I.fillField('Subject', 'new-minimized');
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('io-ox-mail-compose-window.active');

    I.say('create: new-maximized');
    mail.newMail();
    I.fillField({ css: '.active .mail-input input[name="subject"]' }, 'new-maximized');
    I.click(mail.locators.compose.minimize);
    I.waitForInvisible('io-ox-mail-compose-window.active');

    I.say('wait until requirement are ready');
    I.waitForElement(locate('.list-view li.list-item').withText('new-maximized'), 30);

    ['new-minimized', 'restored-minimized'].forEach((subject) => {
        I.say(`delete: ${subject} (removes taskbar item)`);
        mail.selectMail(subject);
        I.click('Delete', '.inline-toolbar-container');
        I.waitForText('This would also delete a currently edited draft.');
        dialogs.clickButton('Delete');
        I.waitForDetached(locate('.list-view li.list-item').withText(subject), 30);
        I.waitForDetached(subject.indexOf('restored') >= 0 ? `.taskbar-button[aria-label="Mail: ${subject}"]` : `.taskbar-button[aria-label="${subject}"]`);
    });

    var subject = 'new-maximized';
    I.say(`delete: ${subject} (keeps taskbar item and shows message)`);
    mail.selectMail(subject);
    // maximize
    I.click(`.taskbar-button[aria-label="Mail: ${subject}"]`);
    I.waitForVisible('.io-ox-mail-compose-window.active');
    if (subject === 'restored-maximized') pause();
    I.click('[data-action="io.ox/mail/actions/delete"]');
    I.waitForText('This would also delete a currently edited draft.');
    dialogs.clickButton('Delete');
    I.waitForText('The mail draft could not be found on the server. It was sent or deleted in the meantime.', 10, '.io-ox-mail-compose-window.active');
    I.click(mail.locators.compose.minimize);
    // minimize and wait for next refresh that removes also this taskbar item
    I.waitForInvisible('io-ox-mail-compose-window.active');
    I.retry(5).click('~Refresh');
    I.waitForDetached(`.taskbar-button[aria-label="Mail: ${subject}"]`, 30);
});
