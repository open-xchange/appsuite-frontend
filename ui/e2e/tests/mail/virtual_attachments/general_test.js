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

Feature('Mail > Virtual Attachments');

Before(async ({ users }) => {
    const user = await users.create();
    await Promise.all([
        user.hasConfig('com.openexchange.file.storage.mail.enabled', true),
        user.hasConfig('com.openexchange.file.storage.mail.fullNameAll', 'VirtualAttachments/virtual/all'),
        user.hasConfig('com.openexchange.file.storage.mail.fullNameReceived', 'VirtualAttachments/INBOX'),
        user.hasConfig('com.openexchange.file.storage.mail.fullNameSent', 'VirtualAttachments/INBOX/Sent')
    ]);
});

After(async ({ users }) => {
    await users.removeAll();
});

async function prepare() {
    const { I, users, mail } = inject();
    const [user] = users;
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail');
    I.waitForText('View all attachments', 5, '.folder-tree');
    mail.newMail();
    within('.io-ox-mail-compose-window', function () {
        I.fillField('To', user.userdata.primaryEmail);
        I.pressKey('Enter');
        I.fillField('Subject', 'C83396');
        I.pressKey('Enter');
        I.fillField({ css: 'textarea.plain-text' }, 'Yo!');
        I.say('Add attachments');
        mail.addAttachment('media/files/generic/testdocument.rtf');
        mail.addAttachment('media/files/generic/testdocument.odt');
        mail.addAttachment('media/files/generic/testpresentation.ppsm');
    });
    mail.send();
}

Scenario('[C83396] View all attachments (from Mail)', async ({ I, drive }) => {
    await prepare();
    I.click('View all attachments', '.folder-tree');
    drive.waitForApp();
    within('.list-view', () => {
        I.waitForText('In Sent');
        I.waitForText('In Inbox');
        I.waitForText('testdocument.rtf');
    });
});

Scenario('[C83405] View all attachments (from Mail-View)', async ({ I, drive }) => {
    await prepare();
    I.clickToolbar('View');
    I.click('All attachments', '.dropdown.open .dropdown-menu');
    drive.waitForApp();
    within('.list-view', () => {
        I.waitForText('In Sent');
        I.waitForText('In Inbox');
        I.waitForText('testdocument.rtf');
    });
});

Scenario('[C83397] View all attachments (from Drive)', async ({ I, drive }) => {
    await prepare();
    I.logout();
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    within('.list-view', () => {
        I.waitForText('In Sent');
        I.waitForText('In Inbox');
        I.waitForText('testdocument.rtf');
    });
});

Scenario('[C83398] View all INBOX attachments', async ({ I, drive }) => {
    await prepare();
    I.logout();
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    I.selectFolder('In Inbox');
    within('.list-view', () => {
        I.waitForText('testdocument.rtf');
        I.waitForText('testdocument.odt');
        I.waitForText('testpresentation.ppsm');
        I.seeNumberOfVisibleElements('.list-item', 3);
        I.dontSee('In Sent');
        I.dontSee('In Inbox');
    });
});

Scenario('[C83399] View all SENT attachments', async ({ I, drive }) => {
    await prepare();
    I.logout();
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    I.selectFolder('In Sent');
    within('.list-view', () => {
        I.waitForText('testdocument.rtf');
        I.waitForText('testdocument.odt');
        I.waitForText('testpresentation.ppsm');
        I.seeNumberOfVisibleElements('.list-item', 3);
        I.dontSee('In Sent');
        I.dontSee('In Inbox');
    });
});

Scenario('[C125297] Attachments are linked to mails', async ({ I, drive }) => {
    await prepare();
    I.logout();

    // Login Drive and select Attachment Folder
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('My attachments');
    I.selectFolder('My attachments');
    within('.list-view', () => {
        I.waitForText('testdocument.rtf');
        I.waitForText('testdocument.odt');
        I.waitForText('testpresentation.ppsm');
    });

    // Open Dropdown and select 'view' to to open detail-view
    within('~Files', () => {
        I.waitForText('testpresentation.ppsm');
        I.rightClick(locate('.file-type-ppt').withText('testpresentation'));
    });
    I.clickDropdown('View');

    // Wait for detail-view and open attachment Email
    I.waitForElement('.viewer-dark-theme');
    within(locate('.viewer-dark-theme'), () => {
        I.see('View message');
        I.click('View message');
    });

    // Check Email for attachment
    I.waitForElement('.io-ox-mail-detail-window');
    within(locate('.io-ox-mail-detail-window'), () => {
        I.see('3 attachments');
        I.click('3 attachments');
        I.waitForText('testpresentation.ppsm');
    });
});

