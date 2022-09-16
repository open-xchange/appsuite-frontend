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

/// <reference path="../../steps.d.ts" />

Feature('Sharing');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C45032] Edit Permissions at "My shares"', async function ({ I, users, drive, dialogs }) {
    session('Alice', () => {
        I.login('app=io.ox/files');
        drive.waitForApp();
        I.waitForText('My shares');
        I.selectFolder('My shares');
        drive.waitForApp();
        // sometimes this is not fast enough and there are 4 objects
        I.waitForInvisible({ xpath: '//li[contains(@class, "list-item selectable")]' });

        //I.shareFolder('Music');
        I.click('My files', '.folder-tree');
        I.selectFolder('Music');
        I.waitForVisible(locate('.breadcrumb-tail[data-module="infostore"]').withText('Music'));
        I.waitForText('Share');
        I.clickToolbar('Share');
        dialogs.waitForVisible();
        I.click('~Select contacts');
        I.waitForElement('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.waitForText(users[1].get('primaryEmail'));
        I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
        dialogs.clickButton('Select');
        I.waitForDetached('.address-picker');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.dontSee('Guest', '.permissions-view');
        I.waitForElement({ xpath: '//div[contains(@class, "permission row")][1]' });
        I.waitForElement({ xpath: '//div[contains(@class, "permission row")][2]' });
        I.waitForText('Viewer');
        dialogs.clickButton('Share');
        I.waitForDetached('.modal-dialog');

        I.selectFolder('My shares');
        I.waitForElement(locate('.displayname').withText('Music').inside('.list-view'));
        I.waitForElement({ xpath: '//li[contains(@class, "list-item selectable file-type-folder")]' });

        I.retry(5).click('Music', '.list-view .displayname');
    });

    session('Bob', () => {
        I.login('app=io.ox/files', { user: users[1] });
        drive.waitForApp();
        I.waitForText('Shared files', 5, '.folder-tree');
        I.selectFolder('Shared files');
        drive.waitForApp();
        I.waitForText(users[0].get('name'));
        I.selectFolder(users[0].get('name'));
        I.waitForText('Music', 5, '.list-view');
        I.selectFolder('Music');
        I.waitForInvisible('New', '.classic-toolbar');
        I.selectFolder(users[0].get('name'));
    });

    session('Alice', () => {
        I.click('Edit share');
        I.waitForText('Share folder');
        I.waitForText('Details', 5, locate('.permissions-view .row').at(2));
        I.click('Details', locate('.permissions-view .row').at(2));
        I.clickDropdown('Create objects and subfolders');

        //close the dropdown
        I.click('.smart-dropdown-container');

        dialogs.waitForVisible();
        dialogs.clickButton('Share');
        I.waitForDetached('.modal-dialog');
    });

    session('Bob', () => {
        I.triggerRefresh();

        I.selectFolder('Music');
        I.retry(5).clickToolbar('New');
        I.clickDropdown('Folder');
        dialogs.waitForVisible();
        I.waitForText('Add new folder', 5, dialogs.locators.header);
        I.fillField('Folder name', 'Hello from Bob');
        I.wait(1);
        dialogs.clickButton('Add');
        I.waitForDetached('.modal-dialog');
    });

    session('Alice', () => {
        I.selectFolder('Music');

        I.triggerRefresh();

        I.waitForText('Hello from Bob');
    });
});

// TODO: shaky, failed (10 runs on 2019-11-28)
Scenario('[C107063] Revoke Permissions at "My shares"', async function ({ I, users, drive, dialogs }) {
    session('Alice', () => {
        I.login('app=io.ox/files');
        drive.waitForApp();
        I.selectFolder('My shares');
        // sometimes this is not fast enough and there are 4 objects
        I.retry(3).seeNumberOfElements('.list-view li.list-item', 0);

        //I.shareFolder('Music');
        I.selectFolder('Music');
        I.waitForText('Share');
        I.clickToolbar('Share');
        dialogs.waitForVisible();
        I.click('~Select contacts');
        I.waitForElement('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.waitForText(users[1].get('primaryEmail'));
        I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
        dialogs.clickButton('Select');
        I.waitForDetached('.address-picker');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.dontSee('Guest', '.permissions-view');
        I.seeNumberOfElements('.permissions-view .permission.row', 2);
        dialogs.waitForVisible();
        dialogs.clickButton('Share');
        I.waitForDetached('.modal-dialog');

        I.selectFolder('My shares');
        I.waitForElement(locate('.displayname').withText('Music').inside('.list-view'));
        I.seeNumberOfElements('.list-view li.list-item', 1);
        I.waitForText('Music', 5, '.list-view');

        I.click('Music', '.list-view .displayname');
    });

    session('Bob', () => {
        I.login('app=io.ox/files', { user: users[1] });
        drive.waitForApp();
        I.click({ css: 'li.folder[aria-label^="Shared files"] .folder-arrow' });
        I.waitForText(users[0].get('name'), 5, '.folder-tree');
        I.selectFolder(users[0].get('name'));
        I.waitForText('Music', 5, '.list-view');
    });

    session('Alice', () => {
        I.clickToolbar('Revoke access');
        I.waitForText('Revoked access.');
    });

    session('Bob', () => {
        I.triggerRefresh();

        I.waitForInvisible('Shared files', 5, '.folder-tree');
        //I.dontSee('Music', '.list-view');
    });
});

Scenario('[C73919] Copy a shared file to another folder', async function ({ I, users, drive, dialogs }) {
    // the test case also shares with an external user, this is left out for now.

    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.waitForText('document.txt', 5, '.file-list-view');

    I.click(locate('.list-view li').withText('document.txt'));
    I.clickToolbar('~View');
    drive.waitForViewer();
    I.waitForEnabled({ css: '.io-ox-viewer input.file-input' });
    I.attachFile('.io-ox-viewer input.file-input', 'e2e/media/files/0kb/document.txt');
    dialogs.waitForVisible();
    dialogs.clickButton('Upload');
    I.waitForText('Versions (2)');
    I.clickToolbar('~Close viewer');
    I.waitForDetached('.io-ox-viewer');
    I.see('Versions (2)', '.detail-pane');

    I.waitForText('Share');
    I.clickToolbar('Share');
    dialogs.waitForVisible();
    I.click('~Select contacts');
    I.waitForElement('.modal .list-view.address-picker li.list-item');
    I.fillField('Search', users[1].get('name'));
    I.waitForText(users[1].get('name'), 5, '.address-picker');
    I.waitForText(users[1].get('primaryEmail'));
    I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
    dialogs.clickButton('Select');
    I.waitForElement(locate('.permissions-view .row').at(1));
    I.fillField('.form-control.message-text', 'Hello');
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.see('This file is shared with others', '.detail-pane');

    I.clickToolbar('~More actions');
    I.click('Copy');
    dialogs.waitForVisible();
    I.waitForText('Copy', 5, '.modal');
    I.pressKey('Arrow_Down');
    I.retry(5).click('Documents', '.modal');
    I.waitForElement(locate('li.selected').withAttr({ 'aria-label': 'Documents' }).inside('.modal-body'));
    dialogs.clickButton('Copy');
    I.waitForText('File has been copied', 5);

    I.selectFolder('Documents');
    I.waitForText('document.txt', 5, '.list-view');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.waitForVisible(locate('.io-ox-files-main .list-view li').withText('document.txt'));
    I.click(locate('.list-view li').withText('document.txt'));
    I.see('Upload new version', '.detail-pane');
    I.dontSee('Versions (2)', '.detail-pane');
    I.see('Shares', '.detail-pane');
    I.dontSee('This file is shared with others', '.detail-pane');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForText('has shared the file', undefined, '.list-view');
    I.click(locate('li.list-item'));
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText('View file');
        I.click('View file');
    });
    I.waitForElement({ css: '[aria-label="View details"]' });
    I.click('~View details');
    I.click('Shared files', '.detail-pane');
    I.waitForDetached('.busy-indicator.io-ox-busy');
    I.waitForText('document.txt');
    I.retry(5).click(locate('.io-ox-files-main .list-view li').withText('document.txt'));
    I.see('Versions (2)', '.detail-pane');
    I.see('This file is shared with others', '.detail-pane');

    I.clickToolbar(locate('.io-ox-files-main .classic-toolbar [aria-label="More actions"]'));
    I.click(locate('.dropdown.open.more-dropdown li').withText('Copy'));
    dialogs.waitForVisible();
    I.waitForText('Copy', 5, '.modal');
    I.pressKey('Arrow_Down');
    I.retry(5).click('Documents', '.modal');
    I.waitForElement(locate('li.selected').withAttr({ 'aria-label': 'Documents' }).inside('.modal-body'));
    dialogs.clickButton('Copy');
    I.waitForDetached('.modal-dialog');
    I.waitForText('File has been copied', 5);

    I.selectFolder('My files');
    I.waitForElement('.io-ox-files-main .list-view.complete');
    I.selectFolder('Documents');
    I.waitForVisible(locate('.io-ox-files-main .list-view li').withText('document.txt'));
    I.click(locate('.io-ox-files-main .list-view li').withText('document.txt'));
    I.waitForText('Upload new version', 5, '.detail-pane');
    I.dontSee('Versions (2)', '.detail-pane');
    I.see('Shares', '.detail-pane');
    I.dontSee('This file is shared with others', '.detail-pane');
});

Scenario('[DOCS-3066] Sharing link area is visible for decrypted files and invisible for encrypted files on click details view "This file is shared with others"', async function ({ I, users, drive, dialogs }) {

    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.waitForText('document.txt', 5, '.file-list-view');
    I.click(locate('.list-view li').withText('document.txt'));

    I.waitForText('Share');
    I.clickToolbar('Share');
    dialogs.waitForVisible();
    I.click('~Select contacts');
    I.waitForElement('.modal .list-view.address-picker li.list-item');
    I.fillField('Search', users[1].get('name'));
    I.waitForText(users[1].get('name'), 5, '.address-picker');
    I.waitForText(users[1].get('primaryEmail'));
    I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
    dialogs.clickButton('Select');
    I.waitForElement(locate('.permissions-view .row').at(1));
    dialogs.clickButton('Share');
    I.waitForDetached('.modal-dialog');
    I.click(locate('.list-view li').withText('document.txt'));
    I.waitForText('This file is shared with others', 5, '.detail-pane');

    I.click('This file is shared with others', '.detail-pane');
    dialogs.waitForVisible();
    I.waitForElement('.access-select');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    I.rightClick(locate('.list-view li').withText('document.txt'));
    I.waitForText('Rename', 5, '.smart-dropdown-container.dropdown.open');
    I.click('Rename', '.smart-dropdown-container.dropdown.open');
    dialogs.waitForVisible();
    I.fillField('.modal input', 'document.txt.pgp');
    dialogs.clickButton('Rename');
    I.waitForText('Yes');
    dialogs.clickButton('Yes');
    I.waitForDetached('.modal-dialog');

    I.waitForText('document.txt.pgp', 5, '.file-list-view');
    I.click(locate('.list-view li').withText('document.txt.pgp'));
    I.waitForText('This file is shared with others', 5, '.detail-pane');
    I.retry(3).click('This file is shared with others', '.detail-pane');
    dialogs.waitForVisible();
    I.dontSeeElementInDOM('.access-select');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

});

Scenario('[OXUIB-1830] Without share_links and invite_guests capabilities the user is able to share to internal users only', async function ({ I, users, drive, dialogs }) {
    const [user] = users;

    const folder = await I.grabDefaultFolder('infostore');
    const testFolder = await I.haveFolder({ title: 'Testfolder', module: 'infostore', parent: folder });
    await Promise.all([
        I.haveFile(testFolder, 'media/files/0kb/document.txt'),
        user.hasConfig('com.openexchange.capability.share_links', false),
        user.hasConfig('com.openexchange.capability.invite_guests', false)
    ]);

    I.wait(3);

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.waitForText('Testfolder', 5, '.file-list-view');
    I.rightClick(locate('.filename').withText('Testfolder'), '.file-list-view');
    I.clickDropdown('Share / Permissions');
    I.waitForText('Share folder "Testfolder', 5, '.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog .invite-people');
    I.dontSeeElement('.share-permissions-dialog .access-select');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.share-permissions-dialog');

    I.doubleClick(locate('.folder-label').withText('My files'), '.private-drive-folders');
    I.waitForText('Testfolder', 5, '.private-drive-folders');
    I.rightClick(locate('.folder-label').withText('Testfolder'), '.private-drive-folders');
    I.clickDropdown('Permissions');
    I.waitForText('Permissions for folder "Testfolder', 5, '.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog .invite-people');
    I.dontSeeElement('.share-permissions-dialog .access-select');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.share-permissions-dialog');

    I.waitForElement(locate('.filename').withText('document.txt'), 5, '.file-list-view');
    I.rightClick(locate('.filename').withText('document.txt'), '.file-list-view');
    I.clickDropdown('Share / Permissions');
    I.waitForText('Share file "document.txt', 5, '.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog .invite-people');
    I.dontSeeElement('.share-permissions-dialog .access-select');
});

Scenario('[OXUIB-1830] Viewers do not see sharing options in the context menu', async function ({ I, users, drive, dialogs }) {
    const [user, guest] = users;

    const folder = await I.grabDefaultFolder('infostore');
    const testFolder = await I.haveFolder({ title: 'Testfolder', module: 'infostore', parent: folder });
    await I.haveFile(testFolder, 'media/files/0kb/document.txt');

    I.login('app=io.ox/files', { user });
    drive.waitForApp();

    I.waitForText('Testfolder', 5, '.file-list-view');
    I.rightClick(locate('.filename').withText('Testfolder'), '.file-list-view');
    I.clickDropdown('Share / Permissions');
    I.waitForText('Share folder "Testfolder', 5, '.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog');
    I.waitForElement('.share-permissions-dialog .invite-people');
    I.click('.twitter-typeahead .tt-input');
    I.waitForFocus('.twitter-typeahead .tt-input');
    I.fillField('.twitter-typeahead .tt-input', guest.userdata.email1);
    I.pressKey('Enter');
    I.waitForText(guest.userdata.display_name);
    dialogs.clickButton('Share');
    I.waitForDetached('.share-permissions-dialog');

    I.logout();

    I.login('app=io.ox/files', { user: guest });
    drive.waitForApp();

    I.waitForText('Shared files', 5, '.public-drive-folders');
    I.doubleClick(locate('.folder-label').withText('Shared files'), '.public-drive-folders');
    I.waitForText(user.userdata.display_name, 5, '.public-drive-folders');
    I.click(locate('.folder-label').withText(user.userdata.display_name), '.public-drive-folders');
    I.waitForText('Testfolder', 5, '.file-list-view');
    I.rightClick(locate('.filename').withText('Testfolder'), '.file-list-view');
    I.waitForElement('.dropdown-menu');
    I.waitForText('Add to favorites');
    I.dontSee('Share / Permissions');
    I.pressKey('Escape');

    I.rightClick(locate('.folder-label').withText(user.userdata.display_name), '.public-drive-folders');
    I.waitForElement('.dropdown-menu');
    I.waitForText('Add to favorites');
    I.dontSee('Share / Permissions');
    I.pressKey('Escape');

    I.doubleClick(locate('.filename').withText('Testfolder'), '.file-list-view');
    I.waitForElement(locate('.filename').withText('document.txt'), 5, '.file-list-view');
    I.rightClick(locate('.filename').withText('document.txt'), '.file-list-view');
    I.waitForElement('.dropdown-menu');
    I.waitForText('View');
    I.dontSee('Share / Permissions');
});
