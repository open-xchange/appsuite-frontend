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

const { expect } = require('chai');

/// <reference path="../../steps.d.ts" />

Feature('Sharing');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C45021] Generate simple link for sharing', async function ({ I, drive, dialogs }) {
    I.login('app=io.ox/files');
    drive.waitForApp();

    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    drive.shareItem();
    dialogs.waitForVisible();
    I.waitForText('Invited people only', 5);
    I.selectOption('Who can access this folder?', 'Anyone with the link and invited people');
    I.waitForText('Copy link', 5);
    I.click('Copy link');
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    let url = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    url = Array.isArray(url) ? url[0] : url;
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.logout();

    I.amOnPage(url);
    drive.waitForApp();
    I.dontSee('Documents', '.list-view');
    I.see('Music', '.folder-tree .selected');
});

// TODO: shaky (element (.list-view) is not in DOM or there is no element(.list-view) with text "A subfolder" after 5 sec)
Scenario('[C252159] Generate link for sharing including subfolders', async function ({ I, drive, dialogs }) {
    let url = null;
    I.login('app=io.ox/files');
    drive.waitForApp();

    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.say('Share folder with subfolder');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    I.waitForDetached('.page.current .busy');
    I.clickToolbar('New');
    I.waitForVisible('.dropdown.open .dropdown-menu');
    I.clickDropdown('Folder');
    dialogs.waitForVisible();
    I.waitForText('Add new folder', 5, dialogs.locators.header);
    I.fillField('Folder name', 'A subfolder');
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');
    I.clickToolbar('New');
    I.waitForVisible('.dropdown.open .dropdown-menu');
    I.clickDropdown('Folder');
    dialogs.waitForVisible();
    I.fillField('Folder name', 'Second subfolder');
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');
    I.selectFolder('My files');
    I.waitForElement(locate('.filename').withText('Music').inside('.list-view'));
    I.click(locate('.filename').withText('Music').inside('.list-view'));
    I.click('Share');
    dialogs.waitForVisible();
    I.waitForText('Invited people only', 5);
    I.selectOption('Who can access this folder?', 'Anyone with the link and invited people');
    I.waitForText('Copy link', 5);
    I.click('Copy link');
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    url = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    url = Array.isArray(url) ? url[0] : url;
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.logout();
    I.say('Check sharing link');
    I.amOnPage(url);
    drive.waitForApp();
    I.waitForText('A subfolder', 5, '.list-view');
    I.seeNumberOfVisibleElements('.list-view li.list-item', 2);
    I.see('Second subfolder');
});

Scenario('[C45022] Generate simple link for sharing with password', async function ({ I, drive, dialogs }) {
    I.login('app=io.ox/files');
    drive.waitForApp();
    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.waitForElement(myfiles);
    I.selectFolder('Music');

    I.say('Create sharing link wiht password');

    I.clickToolbar('Share');
    dialogs.waitForVisible();
    I.selectOption('.form-group select', 'Anyone with the link and invited people');
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    let link = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    link = Array.isArray(link) ? link[0] : link;
    I.click('.settings-button');
    dialogs.waitForVisible();
    I.fillField('Password', 'CorrectHorseBatteryStaple');
    dialogs.clickButton('Save');

    I.waitForText('Copy link');
    I.click('Copy link');
    I.waitForText('The link has been copied to the clipboard', 5, '.io-ox-alert');
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.logout();

    I.say('Check sharing link');
    I.amOnPage(link);
    I.waitForVisible('input[name="password"]');
    I.waitForFocus('input[name="password"]');
    I.fillField('input[name="password"]', 'CorrectHorseBatteryStaple');
    I.click('signin');
    drive.waitForApp();
    I.see('Music', '.folder-tree .selected');
});

// TODO: works perfect locally but breaks remotely for puppeteer and webdriver
// Reason: With --no-sandbox, clipboard cannot be accessed
Scenario.skip('[C83385] Copy to clipboard @puppeteer', async function ({ I, drive, dialogs }) {
    await I.allowClipboardRead();
    I.login('app=io.ox/files');
    drive.waitForApp();
    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    drive.waitForApp();
    drive.shareItem();
    I.waitForVisible('.clippy');
    let url = await I.grabValueFrom('.share-wizard input[type="text"]');
    url = Array.isArray(url) ? url[0] : url;
    I.click('~Copy to clipboard');
    I.waitForText('Copied');
    const clipboard = await I.executeScript(function () {
        return navigator.clipboard.readText();
    });
    expect(clipboard).to.equal(url);
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();
    I.amOnPage(url);
    I.waitForText('Music');
});
// TODO: shaky (element (.fa-spin.fa-refresh) still not present on page after 30 )
Scenario('[C85625] My Shares default sort order', async function ({ I, drive, dialogs }) {
    function share(item, file) {
        I.retry(5).click(locate('li.list-item').withText(item));
        drive.shareItem(file);
        dialogs.waitForVisible();
        I.selectOption('.form-group select', 'Anyone with the link and invited people');
        I.waitForNetworkTraffic();
        dialogs.clickButton('Share');
        I.waitForDetached('.modal-dialog');
    }
    function selectAndWait(folder) {
        I.selectFolder(folder);
        drive.waitForApp();
        I.waitForText(folder, undefined, '.breadcrumb-view.toolbar-item');
    }
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'media/files/0kb/document.txt');
    const testFolder = await I.haveFolder({ title: 'Testfolder', module: 'infostore', parent: folder });
    await Promise.all([
        I.haveFile(testFolder, 'media/files/0kb/document.txt'),
        I.haveFile(testFolder, 'media/files/generic/testdocument.rtf'),
        I.haveFile(testFolder, 'media/files/generic/testdocument.odt'),
        I.haveFile(testFolder, 'media/files/generic/testpresentation.ppsm')
    ]);
    I.login('app=io.ox/files&folder=' + folder);
    drive.waitForApp();
    share('document.txt', true);
    selectAndWait('Testfolder');
    share('testdocument.rtf', true);
    share('testpresentation.ppsm', true);
    selectAndWait('My files');
    share('Testfolder');

    selectAndWait('My shares');
    I.waitForText('Testfolder', undefined, '.myshares-list');
    expect(await I.grabTextFromAll(locate('li.list-item .displayname'))).to.deep.equal(['Testfolder', 'testpresentation.ppsm', 'testdocument.rtf', 'document.txt']);
    I.click('Sort by');
    I.seeElement(locate('i.fa-check').inside(locate('.dropdown a').withText('Date')));
    I.seeElement(locate('i.fa-check').inside(locate('.dropdown a').withText('Descending')));
    I.pressKey('Escape');
});

Scenario('[C45026] Edit shared object with multiple users and modify the permissions for a specific user', async function ({ I, users, mail, drive, dialogs, autocomplete }) {
    const smartDropDown = '.smart-dropdown-container.dropdown.open',
        document = '.white-page.letter.plain-text';

    await Promise.all([
        users.create(),
        users.create(),
        users.create()
    ]);

    function addUser(user) {
        I.fillField('input[placeholder="Name or email address"]', user.userdata.primaryEmail);
        I.waitForElement('.participant-wrapper');
        autocomplete.selectFirst();
        I.waitForText(user.userdata.name, 5, locate('.permission.row').withAttr({ 'aria-label': `${user.userdata.sur_name}, User, Internal user.` }));
    }

    function setRights(curRole, targetRole, user) {
        I.waitForElement(locate('.permission.row').withAttr({ 'aria-label': `${user.userdata.sur_name}, User, Internal user.` }));
        I.click(curRole, locate('.permission.row').withAttr({ 'aria-label': `${user.userdata.sur_name}, User, Internal user.` }));
        I.waitForText(targetRole, 5, smartDropDown);
        I.clickDropdown(targetRole);
    }

    function openDocument() {
        I.openApp('Mail');
        mail.waitForApp();
        mail.selectMail(users[0].userdata.name);

        I.waitForElement('.mail-detail-frame');
        within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View file');
            I.click('View file');
        });
    }

    function editDocument(text, save = true) {
        I.waitForText('Edit', 10, '.viewer-toolbar');
        I.click('Edit', '.viewer-toolbar');
        I.waitForElement('.io-ox-editor textarea.content');
        I.waitForFocus('.io-ox-editor textarea.content');
        I.fillField('.io-ox-editor textarea.content', text);

        if (save) I.click('Save', '.io-ox-editor-window .window-footer');
    }

    await session('Alice', async () => {
        const folder = await I.grabDefaultFolder('infostore');
        await I.haveFile(folder, 'media/files/0kb/document.txt');

        I.login('app=io.ox/files');
        drive.waitForApp();

        I.waitForText('document.txt');
        I.rightClick(locate('.filename').withText('document.txt'));
        I.waitForText('Share / Permissions', 5, smartDropDown);
        I.clickDropdown('Share / Permissions');

        I.waitForElement('.modal-dialog');
        within('.modal-dialog', () => {
            I.waitForFocus('input[placeholder="Name or email address"]');
            addUser(users[1]);
            addUser(users[2]);
            addUser(users[3]);
        });

        setRights('Viewer', 'Reviewer', users[2]);
        setRights('Viewer', 'Reviewer', users[3]);
        I.fillField('.form-control.message-text', 'Hello');

        dialogs.clickButton('Share');
    });

    await session('Charlie', () => {
        I.login('app=io.ox/files', { user: users[2] });
        I.dontSee('document.txt');

        openDocument();
        I.waitForElement(locate(document).withText(''), 30);
        editDocument('here is charlie', { save: false });
    });

    await session('Dave', () => {
        I.login('app=io.ox/files', { user: users[3] });
        I.dontSee('document.txt');

        openDocument();
        I.waitForElement(locate(document).withText(''), 30);
        editDocument('here is dave', { save: true });
    });

    await session('Charlie', () => {
        I.click('Save', '.io-ox-editor-window .window-footer');
        I.fillField('.io-ox-editor textarea.content', 'here is charlie again');
    });

    await session('Bob as Viewer', () => {
        I.login('app=io.ox/files', { user: users[1] });
        I.dontSee('document.txt');

        openDocument();
        I.waitForElement(locate(document).withText('here is charlie'), 30);
        I.dontSee('Edit', '.viewer-toolbar');
    });

    await session('Alice', () => {
        // set charlies rights to viewer rights
        I.rightClick(locate('.filename').withText('document.txt'));
        I.waitForText('Share / Permissions', 5, smartDropDown);
        I.click('Share / Permissions', smartDropDown);

        setRights('Reviewer', 'Viewer', users[2]);
        dialogs.clickButton('Share');
        I.waitForNetworkTraffic();
    });

    await session('Charlie', () => {
        I.click('Save', '.io-ox-editor-window .window-footer');

        I.waitForElement('.io-ox-alert-error');
        within('.io-ox-alert-error', () => {
            I.waitForText('You do not have the appropriate permissions to update the document.');
        });
    });

    await session('Alice', () => {
        I.rightClick(locate('.filename').withText('document.txt'));
        I.clickDropdown('Share / Permissions');

        // revoke access of dave
        I.waitForElement('button[title="Actions"]', locate('.permission.row').withAttr({ 'aria-label': `${users[3].userdata.sur_name}, User, Internal user.` }));
        I.click('button[title="Actions"]', locate('.permission.row').withAttr({ 'aria-label': `${users[3].userdata.sur_name}, User, Internal user.` }));
        I.waitForText('Revoke access', 5, '.smart-dropdown-container.dropdown.open');
        I.clickDropdown('Revoke access');
        I.waitNumberOfVisibleElements('.permission.row', 2);
        dialogs.clickButton('Share');
        I.waitForNetworkTraffic();
    });

    await session('Dave', () => {
        openDocument();

        I.waitForElement('.io-ox-alert-error', 10);
        within('.io-ox-alert-error', () => {
            I.waitForText('You do not have the appropriate permissions to read the document.');
        });
    });
});

Scenario('[C45025] Create shared object with multiple users (external users) with different permissions', async function ({ I, users, contexts, drive, dialogs, mail, autocomplete }) {
    const mailListView = '.list-view.visible-selection.mail-item';

    const ctx = await contexts.create();
    await Promise.all([
        users.create(users.getRandom(), ctx),
        users.create(users.getRandom(), ctx)
    ]);

    await session('Alice', async () => {
        const folder = await I.grabDefaultFolder('infostore');
        await I.haveFile(folder, 'media/files/0kb/document.txt');

        I.login('app=io.ox/files');
        drive.waitForApp();
        I.waitForText('document.txt');
        I.rightClick(locate('.filename').withText('document.txt'));
        I.clickDropdown('Share / Permissions');

        dialogs.waitForVisible();
        await within('.modal-dialog', () => {
            I.waitForFocus('input[placeholder="Name or email address"]');
            I.fillField('input[placeholder="Name or email address"]', users[1].userdata.primaryEmail);
            I.seeInField('input[placeholder="Name or email address"]', users[1].userdata.primaryEmail);
            I.waitForInvisible(autocomplete.locators.suggestions);
            I.pressKey('Enter');
            I.waitForText(users[1].userdata.name, 5, locate('.permission.row').withAttr({ 'aria-label': `${users[1].userdata.primaryEmail}, Guest.` }));
            I.waitForEnabled('.form-control.tt-input');
            I.fillField('input[placeholder="Name or email address"]', users[2].userdata.primaryEmail);
            I.seeInField('input[placeholder="Name or email address"]', users[2].userdata.primaryEmail);
            I.waitForInvisible(autocomplete.locators.suggestions);
            I.wait(0.2);
            I.pressKey('Enter');
            I.waitForText(users[2].userdata.name, 5, locate('.permission.row').withAttr({ 'aria-label': `${users[2].userdata.primaryEmail}, Guest.` }));
            I.click('Viewer', locate('.permission.row').withAttr({ 'aria-label': `${users[1].userdata.primaryEmail}, Guest.` }));
        });
        I.clickDropdown('Reviewer');
        dialogs.clickButton('Share');
    });

    await session('Bob as Reviewer', async () => {
        I.login('app=io.ox/files', { user: users[1] });
        drive.waitForApp();
        I.dontSee('document.txt');
        I.openApp('Mail');

        mail.waitForApp();
        I.waitForElement(mailListView);
        I.waitForText(users[0].userdata.name);
        mail.selectMail(users[0].userdata.name);
        I.waitForElement('.mail-detail-frame');
        await within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View file');
            I.retry(5).click('View file');
        });

        I.wait(0.3);
        I.retry(7).switchToNextTab();
        I.waitForText('Edit', 10, '.viewer-toolbar');
        I.retry(5).click('Edit', '.viewer-toolbar');

        I.waitForElement('.io-ox-editor textarea.content');
        I.waitForFocus('.io-ox-editor textarea.content');
        I.fillField('.io-ox-editor textarea.content', 'here is bob');
        I.seeInField('.io-ox-editor textarea.content', 'here is bob');
        I.wait(0.2);
        I.click('Save', '.io-ox-editor-window .window-footer');
    });

    await session('Charlie as Viewer', async () => {
        I.login('app=io.ox/files', { user: users[2] });
        drive.waitForApp();
        I.dontSee('document.txt');
        I.openApp('Mail');

        mail.waitForApp();
        I.waitForElement(mailListView);
        I.waitForText(users[0].userdata.name);
        mail.selectMail(users[0].userdata.name);
        I.waitForElement('.mail-detail-frame');
        await within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View file');
            I.retry(5).click('View file');
        });

        I.wait(0.3);
        I.retry(7).switchToNextTab();
        I.waitForElement('.white-page.letter.plain-text', 10);
        I.waitForText('here is bob', 5, '.white-page.letter.plain-text');
        I.dontSee('Edit', '.viewer-toolbar');
    });
});

Scenario('[C83277] Create shared object with expiration date', async function ({ I, drive, dialogs }) {
    let locators = {
        toolbar: locate({ css: '.window-body.classic-toolbar-visible' }),
        textFile: locate({ css: '.list-item.selectable.file-type-txt' }),
        dialog: locate({ css: '.modal-dialog' })
    };

    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'media/files/0kb/document.txt');
    I.login('app=io.ox/files');
    drive.waitForApp();

    I.click(locators.textFile);
    I.waitForText('Share', locators.toolbar);
    I.clickToolbar('Share');
    dialogs.waitForVisible();
    I.selectOption('.form-group select', 'Anyone with the link and invited people');
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    let link = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    I.click('.settings-button');
    dialogs.waitForVisible();
    I.selectOption('Expiration', 'One week');
    dialogs.clickButton('Save');

    I.waitForText('Copy link');
    I.click('Copy link');
    I.waitForText('The link has been copied to the clipboard', 5, '.io-ox-alert');
    link = Array.isArray(link) ? link[0] : link;

    dialogs.clickButton('Share', locators.dialog);
    I.waitForDetached(locators.dialog);
    I.logout();

    I.amOnPage(link);
    I.waitForText('document.txt', 15, '.viewer-toolbar-filename');
});

Scenario('[C110280] Personalized no-reply share mails', async function ({ I, users, drive, mail, dialogs, autocomplete }) {
    await Promise.all([
        users.create(),
        users[0].hasAccessCombination('drive'),
        users[0].hasConfig('com.openexchange.share.notification.usePersonalEmailAddress', true)
    ]);

    await session('Alice', async () => {
        I.login('app=io.ox/files', { user: users[0] });
        drive.waitForApp();
        I.clickToolbar('Share');
        dialogs.waitForVisible();
        I.waitForElement(locate('input').withAttr({ 'placeholder': 'Name or email address' }), '.modal-dialog');
        I.fillField(locate('input').withAttr({ 'placeholder': 'Name or email address' }), users[1].userdata.sur_name);
        I.waitForVisible(autocomplete.locators.suggestion);
        I.pressKey('Enter');
        I.waitForText(users[1].userdata.sur_name, 5, '.modal-dialog .permissions-view');
        I.fillField('.form-control.message-text', 'Hello');
        I.seeInField('.form-control.message-text', 'Hello');
        dialogs.clickButton('Share');
        I.waitForDetached('.modal-dialog');
    });

    await session('Bob', async () => {
        I.login('app=io.ox/mail', { user: users[1] });
        mail.waitForApp();
        mail.selectMail(`test.user-${users[0].userdata.sur_name}`);
        I.waitForText(`<${users[0].userdata.primaryEmail}>`, '.mail-detail-pane');
    });
});
