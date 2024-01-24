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

Feature('Mail > Listview');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[OXUIB-1923] Send plain text mail with attachments noticed', async ({ I, users, mail, dialogs }) => {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.say('Send mail with empty last line');
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');
    I.waitForElement('textarea.plain-text');
    I.fillField('textarea.plain-text', 'please see attachment \n');
    I.waitForClickable('.btn[data-action="send"]');
    I.click('Send');
    I.waitForText('Forgot attachment?');
    dialogs.clickButton('Send without attachment');
    I.waitForDetached('.modal-dialog');
    I.waitToHide('.io-ox-mail-compose-window');
    I.waitToHide('.generic-toolbar.mail-progress', 45);

    I.say('Send mail without empty last line');
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');
    I.waitForElement('textarea.plain-text');
    I.fillField('textarea.plain-text', 'please see attachment');
    I.waitForClickable('.btn[data-action="send"]');
    I.click('Send');
    I.waitForText('Forgot attachment?');
});

Scenario('[OXUIB-1923] Reply to mail with empty last line', async ({ I, users, mail, dialogs }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.say('Send mail with empty last line');
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');
    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.fillField('body', 'please see attachment');
        I.pressKey('Enter');
    });
    I.waitForClickable('.btn[data-action="send"]');
    I.click('Send');
    I.waitForText('Forgot attachment?');
    dialogs.clickButton('Send without attachment');
    I.waitForDetached('.modal-dialog');
    I.waitToHide('.io-ox-mail-compose-window');
    I.waitToHide('.generic-toolbar.mail-progress', 45);
    I.waitForElement('.list-item.selectable.unread', 30);
    I.click('.list-item.selectable.unread');

    I.say('Reply as plain text');
    I.wait(0.5);
    I.click('~Reply to sender');
    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    I.wait(0.5);
    I.waitForClickable('a[aria-label="Options"]');
    I.click('a[aria-label="Options"]');
    I.clickDropdown('Plain Text');
    I.waitForElement('textarea.plain-text');
    I.click('Send');
    I.waitToHide('.io-ox-mail-compose-window');
});

Scenario('[OXUIB-1923] Reply to mail without empty last line', async ({ I, users, mail, dialogs }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.say('Send mail without empty last line');
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test');
    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.fillField('body', 'please see attachment');
    });
    I.waitForClickable('.btn[data-action="send"]');
    I.click('Send');
    I.waitForText('Forgot attachment?');
    dialogs.clickButton('Send without attachment');
    I.waitForDetached('.modal-dialog');
    I.waitToHide('.io-ox-mail-compose-window');
    I.waitToHide('.generic-toolbar.mail-progress', 45);
    I.waitForElement('.list-item.selectable.unread', 30);
    I.click('.list-item.selectable.unread');

    I.say('Reply as plain text');
    I.wait(0.5);
    I.click('~Reply to sender');
    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    I.wait(0.5);
    I.waitForClickable('a[aria-label="Options"]');
    I.click('a[aria-label="Options"]');
    I.clickDropdown('Plain Text');
    I.waitForElement('textarea.plain-text');
    I.click('Send');
    I.waitToHide('.io-ox-mail-compose-window');
});
