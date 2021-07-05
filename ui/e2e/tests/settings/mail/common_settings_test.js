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

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario.skip('[C7779] Mail formatting', async function ({ I, users, mail }) {

    const [user] = users;

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/compose']);
    I.waitForText('Mail Compose');
    I.checkOption('Plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="text"]');

    I.openApp('Mail');

    mail.newMail();

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject');
    I.fillField('.io-ox-mail-compose textarea.plain-text', 'Testcontent');

    mail.send();

    I.wait(0.5); // wait for mail to arrive
    I.triggerRefresh();
    I.waitForText('Testsubject', 600, '.list-view');
    mail.selectMail('Testsubject');

    I.waitForText('Testsubject', 20, 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.see('Testcontent');
        I.dontSeeElement(locate('strong').withText('Testcontent'));
    });

    I.openApp('Settings');

    I.checkOption('HTML');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="html"]');

    I.openApp('Mail');

    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject2');
    I.click('.mce-i-bold');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent2');
    });

    mail.send();

    I.wait(0.5); // wait for mail to arrive
    I.triggerRefresh();
    I.waitForText('Testsubject2', 600, '.list-view');
    mail.selectMail('Testsubject2');
    I.waitForText('Testsubject2', 20, 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent2'));
    });

    I.openApp('Settings');

    I.checkOption('HTML and plain text');
    I.seeCheckboxIsChecked('[name="messageFormat"][value="alternative"]');

    I.openApp('Mail');
    mail.newMail();

    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'Testsubject3');
    I.click('.mce-i-bold');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.appendField('body', 'Testcontent3');
    });

    mail.send();

    I.wait(0.5); // wait for mail to arrive
    I.triggerRefresh();
    I.waitForText('Testsubject3', 600, '.list-view');
    mail.selectMail('Testsubject3');

    I.waitForText('Testsubject3', 20, 'h1.subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, function () {
        I.seeElement(locate('strong').withText('Testcontent3'));
    });
});

Scenario('[C114376] Default font style', async function ({ I, users, mail, dialogs }) {
    const smartDropdown = '.smart-dropdown-container.dropdown.open',
        colorPicker = '.dropdown-menu.colorpicker-table',
        mailListView = '.list-view.visible-selection.mail-item';

    await users.create();
    const [alice, bob] = users;

    session('Alice', () => {
        I.login('app=io.ox/mail', { user: alice });

        mail.newMail();
        I.fillField('To', bob.get('primaryEmail'));
        I.fillField('Subject', 'Testsubject Draft');
        I.pressKey('Tab');
        I.fillField('span', 'Testcontent');
        I.click('~Save and close', '.io-ox-mail-compose-window');
        dialogs.clickButton('Save draft');
        I.waitForDetached('.io-ox-mail-compose-window');

        I.click('~Settings');
        I.clickDropdown('Settings');
        I.retry(5).click('~Mail', 'div[aria-label="Settings"]');
        I.retry(5).click('Compose', 'div[aria-label="Settings"]');

        I.waitForElement(locate('.dropdown-label').withText('Font'));
        I.click(locate('.dropdown-label').withText('Font'));
        I.waitForElement(smartDropdown);
        I.waitForElement(smartDropdown);
        I.waitForText('Verdana', 5, smartDropdown);
        I.click('Verdana', smartDropdown);

        I.click(locate('.dropdown-label').withText('Size'));
        I.waitForElement(smartDropdown);
        I.waitForText('16pt', 5, smartDropdown);
        I.click('16pt', smartDropdown);

        I.click(locate('.dropdown-label').withText('Color'));
        I.waitForElement(colorPicker);
        I.waitForElement('div[title="Green"]', 5, colorPicker);
        I.click('div[title="Green"]', colorPicker);

        I.waitForElement(locate('div.example-text[style="font-family: verdana, geneva; font-size: 16pt; color: rgb(0, 128, 0);"]').withText('This is how your message text will look like.'));

        I.openApp('Mail');
        mail.newMail();

        I.fillField('To', bob.get('primaryEmail'));
        I.fillField('Subject', 'Testsubject');
        I.pressKey('Tab');
        I.fillField('span', 'Testcontent');

        mail.send();
    });

    session('Bob', async () => {
        I.login('app=io.ox/mail', { user: bob });

        I.waitForElement(mailListView);
        within(mailListView, () => {
            I.waitForText('Testsubject');
            I.retry(5).click('Testsubject');
        });

        I.waitForElement('.mail-detail-frame');
        await within({ frame: '.mail-detail-frame' }, async () => {
            I.waitForElement(locate('span[style="font-family: verdana; font-size: 16pt;"]').withText('Testcontent'));
        });
    });

    session('Alice', async () => {
        I.click(locate('div').withText('Drafts'), '.open.standard-folders');

        I.waitForElement(mailListView);
        within(mailListView, () => {
            I.waitForText('Testsubject Draft');
            I.retry(5).click('Testsubject Draft');
        });

        I.waitForElement('.mail-detail-frame');
        await within({ frame: '.mail-detail-frame' }, async () => {
            I.waitForElement(locate('div.default-style').withText('Testcontent'));
            I.dontSee(locate('span[style="font-family: verdana; font-size: 16pt;"]').withText('Testcontent'));
        });

        I.waitForText('Edit', 5, '.io-ox-mail-window .classic-toolbar-container');
        I.clickToolbar('Edit');

        I.waitForElement('.io-ox-mail-compose-window');
        within('.io-ox-mail-compose-window', () => {
            I.waitForText('Testsubject Draft');
            I.waitForText('Testcontent');
            I.waitForText('Send', 5, '.io-ox-mail-compose-window .window-footer button');
            I.wait(0.5);
            I.click('Send', '.io-ox-mail-compose-window .window-footer button');
        });
        I.waitForDetached('.io-ox-mail-compose-window');
    });

    session('Bob', async () => {
        I.triggerRefresh();

        I.waitForElement(mailListView);
        within(mailListView, () => {
            I.waitForText('Testsubject Draft');
            I.retry(5).click('Testsubject Draft');
        });

        I.waitForElement('.mail-detail-frame');
        await within({ frame: '.mail-detail-frame' }, async () => {
            I.waitForElement(locate('div.default-style').withText('Testcontent'));
            I.dontSee(locate('span[style="font-family: verdana; font-size: 16pt;"]').withText('Testcontent'));
        });
    });
});
