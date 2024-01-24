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

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose > Real drafts');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});
const iframeLocator = '.io-ox-mail-compose-window .editor iframe';
const editor = locate('.io-ox-mail-compose-window .editor iframe');
const taskbaritem = locate('li').withChild('.taskbar-button');

Scenario('[RD001] Refresh draft folder on change', async function ({ I, mail }) {
    const mailSubject = 'RD001';
    const defaultText = 'Some text';

    await I.haveSetting('io.ox/mail//autoSaveAfter', 2000);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForText('Drafts');
    I.click('~Drafts');
    mail.waitForApp();
    I.waitForInvisible(locate('.folder.selected').withText('Inbox'), 10);
    I.waitForVisible(locate('.folder.selected').withText('Drafts'));
    I.waitForInvisible('.leftside [data-ref="io.ox/mail/listview"] .busy-indicator', 5);
    I.waitForText('Empty', 5, '.leftside [data-ref="io.ox/mail/listview"]');

    // creates space (inital save)
    I.say('1. creates space (inital save)');
    mail.newMail();
    I.waitForText('No subject', 15, '.leftside [data-ref="io.ox/mail/listview"]');

    // update space
    I.say('2. update space');
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.fillField({ css: 'body' }, defaultText);
    });
    I.fillField('Subject', mailSubject);
    I.waitForText(mailSubject, 5, '.list-view');
});

Scenario('[RD002] Restore open space on "edit draft"', async function ({ I, mail }) {
    await I.haveSetting('io.ox/mail//autoSaveAfter', 5000);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    // create space/draft
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();
    I.wait(0.5);
    I.logout();

    // check: draft and taskbar item
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.retry(3).click('~Drafts');
    mail.waitForApp();
    I.waitForInvisible(locate('.folder.selected').withText('Inbox'), 10);
    I.waitForVisible(locate('.folder.selected').withText('Drafts'));
    I.waitForText('No subject', 10, '.list-view .list-item');
    I.seeElement(taskbaritem);

    // restore initially minimized taskbar item
    I.say('1. restore initially minimized taskbar item ');
    mail.selectMail('No subject');
    I.clickToolbar('Edit draft');
    I.waitForElement(editor);
    I.dontSeeElement(taskbaritem);

    // restore minimized taskbar item when clicking "edit draft
    I.say('2. restore minimized taskbar item');
    I.click('~Minimize', '.io-ox-mail-compose-window');
    I.waitForElement(taskbaritem);
    I.waitForInvisible(editor);
    mail.selectMail('No subject');
    I.clickToolbar('Edit draft');
    I.waitForElement(editor);
    I.dontSeeElement(taskbaritem);
    I.logout();

    // restore maximized taskbar item when clicking "edit draft
    I.say('3. restore maximized taskbar item ');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.retry(3).click('~Drafts');
    mail.waitForApp();
    I.waitForInvisible(locate('.folder.selected').withText('Inbox'), 10);
    I.waitForVisible(locate('.folder.selected').withText('Drafts'));
    I.waitForText('No subject', 10, '.list-view .list-item');
    mail.selectMail('No subject');
    I.click(taskbaritem);
    I.waitForElement(editor);
    I.clickToolbar('Edit draft');
    I.wait(0.5);

    I.waitForFunction(() => window.$('.io-ox-mail-compose-window').length === 1);
});

Scenario.skip('[RD003: Handle deleted spaces', async function ({ I, mail, dialogs }) {
    await I.haveSetting('io.ox/mail//autoSaveAfter', 1000);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.wait(0.5);
    I.selectFolder('Drafts');

    // creates spaces (inital save)
    I.say('1. create spaces');
    mail.newMail();
    I.fillField('Subject', 'first space');
    I.waitForElement(locate('.list-view li.list-item').withText('first space'));
    // WORKAROUND: "newMail" helper fails for second mail
    I.refreshPage();

    mail.waitForApp();
    I.selectFolder('Drafts');
    mail.newMail();
    I.fillField('Subject', 'second space');
    I.waitForElement(locate('.list-view li.list-item').withText('second space'));

    // refresh page to cover "failRestore" and "active" case
    I.say('2. refresh page to cover "failRestore" and "active" case');
    I.refreshPage();
    mail.waitForApp();
    I.selectFolder('Drafts');

    // restore and minimize first space again
    I.say('3. restore and minimize first space again');
    I.waitForElement(locate('.taskbar-button').withText('first space'));
    I.click(locate('.taskbar-button').withText('first space'));
    I.waitForElement(editor);
    I.click('~Minimize', '.io-ox-mail-compose-window');
    I.waitForInvisible(editor);
    I.wait(0.5);

    // delete spaces by deleting drafts
    I.say('4. delete spaces by deleting drafts');
    I.waitForText('first space', 10, '.list-view');
    mail.selectMail('first space');
    I.waitForElement('.classic-toolbar [data-action="io.ox/mail/actions/delete"]');
    I.clickToolbar('.classic-toolbar [data-action="io.ox/mail/actions/delete"]');
    // confirm dialog (this also deletes the draft)
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    mail.selectMail('second space');
    I.waitForElement('.classic-toolbar [data-action="io.ox/mail/actions/delete"]');
    I.clickToolbar('.classic-toolbar [data-action="io.ox/mail/actions/delete"]');
    // confirm dialog (this also deletes the draft)
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    // see error message
    I.say('5. see error message');
    I.click(taskbaritem.withText('first space'));
    I.waitForElement(editor);
    I.waitForElement('.io-ox-mail-compose-window.active .window-blocker .message');
    I.click('~Minimize', '.io-ox-mail-compose-window.active');
    I.waitForInvisible(editor);
    I.wait(0.5);

    I.click(taskbaritem.withText('second space'));
    I.waitForElement(editor);
    I.waitForElement('.io-ox-mail-compose-window.active .window-blocker .message');
    I.click('~Minimize', '.io-ox-mail-compose-window.active');
    I.waitForInvisible(editor);
    I.wait(0.5);

    // see removed taskbar item after refresh
    I.say('6. see removed taskbar item after refresh');
    I.refreshPage();
    mail.waitForApp();
    I.dontSeeElement(taskbaritem.withText('first space'));
    I.dontSeeElement(taskbaritem.withText('second space'));
});
