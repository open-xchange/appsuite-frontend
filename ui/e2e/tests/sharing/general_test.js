/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
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
    drive.shareItem('Create sharing link');
    let url = await I.grabValueFrom('.share-wizard input[type="text"]');
    url = Array.isArray(url) ? url[0] : url;
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    I.amOnPage(Array.isArray(url) ? url[0] : url);
    drive.waitForApp();
    I.dontSee('Documents', '.list-view');
    I.see('Music', '.folder-tree .selected');
});

// TODO: shaky (element (.list-view) is not in DOM or there is no element(.list-view) with text "A subfolder" after 5 sec)
Scenario('[C252159] Generate link for sharing including subfolders', async function ({ I, drive, dialogs }) {
    I.login('app=io.ox/files');
    drive.waitForApp();

    const myfiles = locate('.folder-tree .folder-label').withText('My files');
    I.say('Share folder with subfolder');
    I.waitForElement(myfiles);
    I.selectFolder('Music');
    I.waitForDetached('.page.current .busy');
    I.clickToolbar('New');
    I.waitForVisible('.dropdown.open .dropdown-menu');
    I.clickDropdown('Add new folder');
    dialogs.waitForVisible();
    I.waitForText('Add new folder', 5, dialogs.locators.header);
    I.fillField('Folder name', 'A subfolder');
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');
    I.clickToolbar('New');
    I.waitForVisible('.dropdown.open .dropdown-menu');
    I.clickDropdown('Add new folder');
    dialogs.waitForVisible();
    I.fillField('Folder name', 'Second subfolder');
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');
    I.selectFolder('My files');
    I.waitForElement(locate('.filename').withText('Music').inside('.list-view'));
    I.click(locate('.filename').withText('Music').inside('.list-view'));
    drive.shareItem('Create sharing link');
    const url = await I.grabValueFrom('.share-wizard input[type="text"]');
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    I.say('Check sharing link');
    I.amOnPage(Array.isArray(url) ? url[0] : url);
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
    drive.shareItem('Create sharing link');
    I.click('Password required');
    I.waitForFocus('.share-wizard input[type="password"]');
    I.fillField('Enter Password', 'CorrectHorseBatteryStaple');
    I.seeCheckboxIsChecked('Password required');
    let url = await I.grabValueFrom('.share-wizard input[type="text"]');
    url = Array.isArray(url) ? url[0] : url;
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.triggerRefresh();
    I.logout();

    I.say('Check sharing link');
    I.amOnPage(Array.isArray(url) ? url[0] : url);
    I.waitForFocus('input[name="password"]');
    I.fillField('Password', 'CorrectHorseBatteryStaple');
    I.click('Sign in');
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
    drive.shareItem('Create sharing link');
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
    function share(item) {
        I.retry(5).click(locate('li.list-item').withText(item));
        drive.shareItem('Create sharing link');
        dialogs.clickButton('Close');
        I.waitForDetached('.modal-dialog');
    }
    function selectAndWait(folder) {
        I.selectFolder(folder);
        drive.waitForApp();
        I.waitForText(folder, undefined, '.breadcrumb-view.toolbar-item');
    }
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    const testFolder = await I.haveFolder({ title: 'Testfolder', module: 'infostore', parent: folder });
    await Promise.all([
        I.haveFile(testFolder, 'e2e/media/files/0kb/document.txt'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testdocument.rtf'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testdocument.odt'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testpresentation.ppsm')
    ]);
    I.login('app=io.ox/files&folder=' + folder);
    drive.waitForApp();
    share('document.txt');
    selectAndWait('Testfolder');
    share('testdocument.rtf');
    share('testpresentation.ppsm');
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

Scenario('[C45026] Edit shared object with multiple users and modify the permissions for a specific user', async function ({ I, users, drive, dialogs }) {
    const mailListView = '.list-view.visible-selection.mail-item',
        smartDropDown = '.smart-dropdown-container.dropdown.open',
        document = '.white-page.letter.plain-text';

    await Promise.all([
        users.create(),
        users.create(),
        users.create()
    ]);

    function addUser(user) {
        I.wait(0.2); // gentle wait for auto complete
        I.fillField('input[placeholder="Add people"]', user.userdata.primaryEmail);
        I.waitForElement('.participant-wrapper');
        I.pressKey('Enter');
        I.waitForText(user.userdata.name, 5, locate('.permission.row').withAttr({ 'aria-label': `${user.userdata.sur_name}, User, Internal user.` }));
    }

    function setRights(curRole, targetRole, user) {
        I.waitForElement(locate('.permission.row').withAttr({ 'aria-label': `${user.userdata.sur_name}, User, Internal user.` }));
        I.click(curRole, locate('.permission.row').withAttr({ 'aria-label': `${user.userdata.sur_name}, User, Internal user.` }));
        I.waitForText(targetRole, 5, smartDropDown);
        I.click(targetRole, smartDropDown);
    }

    function openDocument() {
        I.openApp('Mail');
        I.waitForElement(mailListView);
        within(mailListView, () => {
            I.waitForText(users[0].userdata.name);
            I.click(users[0].userdata.name, '.list-item.selectable');
        });

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

    session('Alice', async () => {
        const folder = await I.grabDefaultFolder('infostore');
        await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');

        I.login('app=io.ox/files');
        drive.waitForApp();

        I.waitForText('document.txt');
        I.rightClick(locate('.filename').withText('document.txt'));
        I.waitForText('Permissions / Invite people', 5, smartDropDown);
        I.click('Permissions / Invite people', smartDropDown);

        I.waitForElement('.modal-dialog');
        within('.modal-dialog', () => {
            I.waitForFocus('input[placeholder="Add people"]');
            addUser(users[1]);
            addUser(users[2]);
            addUser(users[3]);
        });

        setRights('Viewer', 'Reviewer', users[2]);
        setRights('Viewer', 'Reviewer', users[3]);
        dialogs.clickButton('Share');
    });

    session('Charlie', () => {
        I.login('app=io.ox/files', { user: users[2] });
        I.dontSee('document.txt');

        openDocument();
        I.waitForElement(locate(document).withText(''), 30);
        editDocument('here is charlie', { save: false });
    });

    session('Dave', () => {
        I.login('app=io.ox/files', { user: users[3] });
        I.dontSee('document.txt');

        openDocument();
        I.waitForElement(locate(document).withText(''), 30);
        editDocument('here is dave', { save: true });
    });

    session('Charlie', () => {
        I.click('Save', '.io-ox-editor-window .window-footer');
        I.fillField('.io-ox-editor textarea.content', 'here is charlie again');
    });

    session('Bob as Viewer', () => {
        I.login('app=io.ox/files', { user: users[1] });
        I.dontSee('document.txt');

        openDocument();
        I.waitForElement(locate(document).withText('here is charlie'), 30);
        I.dontSee('Edit', '.viewer-toolbar');
    });

    session('Alice', () => {
        // set charlies rights to viewer rights
        I.rightClick(locate('.filename').withText('document.txt'));
        I.waitForText('Permissions / Invite people', 5, smartDropDown);
        I.click('Permissions / Invite people', smartDropDown);

        setRights('Reviewer', 'Viewer', users[2]);
        dialogs.clickButton('Share');
    });

    session('Charlie', () => {
        I.click('Save', '.io-ox-editor-window .window-footer');

        I.waitForElement('.io-ox-alert-error');
        within('.io-ox-alert-error', () => {
            I.waitForText('You do not have the appropriate permissions to update the document.');
        });
    });

    session('Alice', () => {
        I.rightClick(locate('.filename').withText('document.txt'));
        I.waitForText('Permissions / Invite people', 5, smartDropDown);
        I.click('Permissions / Invite people', smartDropDown);

        // revoke access of dave
        I.waitForElement('button[title="Actions"]', locate('.permission.row').withAttr({ 'aria-label': `${users[3].userdata.sur_name}, User, Internal user.` }));
        I.click('button[title="Actions"]', locate('.permission.row').withAttr({ 'aria-label': `${users[3].userdata.sur_name}, User, Internal user.` }));
        I.waitForText('Revoke access', 5, '.smart-dropdown-container.dropdown.open');
        I.click('Revoke access', '.smart-dropdown-container.dropdown.open');
        dialogs.clickButton('Share');
    });

    session('Dave', () => {
        openDocument();

        I.waitForElement('.io-ox-alert-error');
        within('.io-ox-alert-error', () => {
            I.waitForText('You do not have the appropriate permissions to read the document.');
        });
    });

    // TODO: could be also checked with google accounts etc.
});
