/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Drive > Folder');

const prepare = (I, folder) => {
    I.login('app=io.ox/files' + (folder ? '&folder=' + folder : ''));
    I.waitForElement('.file-list-view.complete');
};

// Returns permission bitmasks for shared folder (user 1 is owner, user 2 is viewer)
const sharedFolder = (folderName, users) => {
    return {
        module: 'infostore',
        subscribed: 1,
        title: folderName,
        permissions: [
            {
                bits: 403710016,
                entity: users[0].userdata.id,
                group: false
            }, {
                bits: 257,
                entity: users[1].userdata.id,
                group: false
            }
        ]
    };
};

Before(async (I, users) => {
    await users.create();
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

// Note: The title of this test, does not really reflect what is tested here
// A better title would be something like: Public files: Upload and new actions not shown in root folder
Scenario('[C8374] Public files: Add a file', (I) => {
    prepare(I);
    I.selectFolder('Public files');
    I.clickToolbar('New');
    I.waitForText('Add new folder');
    I.dontSee('Upload files');
    I.dontSee('New text document');
    I.dontSee('New spreadsheet');
    I.dontSee('New presentation');
    I.dontSee('Add note');
});

// Note: The title of this test, does not really reflect what is tested here (again)
// A better title would be something like: Public files: Moving files to root folder not possible
Scenario('[C8375] Public files: Move a file', async (I) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    prepare(I);
    I.waitForText('document.txt', 1, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.clickToolbar('~More actions');
    I.waitForText('Move');
    I.click('Move', '.smart-dropdown-container');
    I.waitForText('Public files', 1, '.folder-picker-dialog');
    I.click('~Public files', '.folder-picker-dialog');
    I.seeElement('.btn[data-action="ok"][disabled]');
});

Scenario('[C8376] Add a subfolder', async (I) => {
    prepare(I);
    I.click('[title="Actions for My files"]');
    I.click('Add new folder', '.smart-dropdown-container');
    I.waitForText('Add new folder', 1, '.modal-dialog');
    I.fillField('Folder name', 'Testfolder');
    I.click('Add');
    I.waitForText('Testfolder', 1, '.file-list-view');
});

Scenario('[C8377] Invite a person', (I, users) => {
    function share(publicFolder) {
        I.clickToolbar('Share');
        I.click('Invite people');
        I.waitForText('Share folder');
        if (!publicFolder) {
            I.click('Send notification by email');
            I.waitForInvisible('.share-options', 2);
        }
        I.dontSeeCheckboxIsChecked('Send notification by email');
        I.click('~Select contacts');
        I.waitForElement('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.click('.address-picker .list-item');
        I.click({ css: 'button[data-action="select"]' });
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.dontSee('Guest', '.permissions-view');
        I.seeNumberOfElements('.permissions-view .permission.row', 2);
        I.click('Author');
        I.waitForText('Viewer', 1, '.dropdown');
        I.click('Viewer');
        I.click('Share', '.modal');
        I.waitToHide('.modal');
    }
    session('Alice', () => {
        I.login('app=io.ox/files');
        I.waitForElement('.file-list-view.complete');
        I.selectFolder('My shares');
        // sometimes this is not fast enough and there are 4 objects
        I.retry(3).seeNumberOfElements('.list-view li.list-item', 0);
        I.waitForText('My files', 5, '.folder-tree');
        //I.shareFolder('Music');
        I.click('My files', '.folder-tree');
        I.selectFolder('Music');
        share();
        I.waitForElement('.file-list-view.complete');
        I.selectFolder('My shares');
        I.waitForElement(locate('.displayname').withText('Music').inside('.list-view'));
        I.seeNumberOfElements('.list-view li.list-item', 1);
    });

    session('Bob', () => {
        I.login('app=io.ox/files', { user: users[1] });
        I.waitForText('Shared files', 5, '.folder-tree');
        I.waitForElement('.file-list-view.complete');
        I.selectFolder('Shared files');
        I.waitForText(users[0].get('name'));
        I.selectFolder(users[0].get('name'));
        I.waitForElement(locate('.filename').withText('Music').inside('.list-view'));
        I.doubleClick(locate('.filename').withText('Music').inside('.list-view'));
        I.click('[title="Actions for Music"]');
        I.click('[data-action="invite"]', '.smart-dropdown-container');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.waitForText('Viewer', 2, '.permissions-view');
        I.click('Close');
    });

    // Repeat for Public Folder
    const publicFolderName = 'C8377-' + new Date().getTime();
    session('Alice', () => {
        // Add public folder
        I.waitForText('Public files', 5, '.folder-tree');
        I.selectFolder('Public files');
        I.clickToolbar('New');
        I.click('Add new folder', '.dropdown.open');
        I.waitForText('Add new folder', 1, '.modal-dialog');
        I.fillField('Folder name', publicFolderName);
        I.pressKey('Enter');

        I.waitForElement('.file-list-view.complete');
        I.selectFolder(publicFolderName);
        share(true);
    });

    session('Bob', () => {
        I.waitForText('Public files', 5, '.folder-tree');
        I.selectFolder('Public files');
        I.waitForText(publicFolderName, 5, '.list-view');
        I.selectFolder(publicFolderName);
        I.click('[title="Actions for ' + publicFolderName + '"]');
        I.click('[data-action="invite"]', '.smart-dropdown-container');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.see('Viewer', '.permissions-view .row .role');
    });

});

Scenario('[C8378] Invite a group', async (I, users) => {
    // Testrail description:
    // 1. Go to Drive
    // 2. Choose a folder and click the gear button (Context Menu)
    // 3. Choose Invite
    // 4. Invite a group and save (Group has given rights in folder)
    // 5. Verify with two of the group members
    // 6. Repeat for public folder
    const folderName = 'C8378';
    const groupName = 'C8378-group';
    const group = {
        name: groupName,
        display_name: groupName,
        members: [users[1].userdata.id, users[2].userdata.id]
    };

    await I.dontHaveGroup(groupName);
    await I.haveGroup(group);

    const folder = await I.haveFolder(folderName, 'infostore', await I.grabDefaultFolder('infostore'), { user: users[0] });
    I.login('app=io.ox/files&folder=' + folder.data, { user: users[0] });
    I.waitForElement('.file-list-view.complete');
    I.clickToolbar('Share');
    I.waitForText('Invite people');
    I.click('Invite people', '.dropdown.open');
    I.waitForText('Send notification by email');
    I.click('Send notification by email');
    I.fillField('input.tt-input', groupName);
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
    I.waitForText('Group', 5);
    I.click('Share', '.modal-dialog');
    I.logout();

    for(let i = 1; i <= 2; i++) {
        I.login('app=io.ox/files&folder=' + folder.data, { user: users[i] });
        I.waitForElement('.file-list-view.complete');
        I.waitForText(folderName, 2, '.folder-tree');
        I.see(folderName, '.folder-tree');
        I.click('[title="Actions for ' + folderName + '"]');
        I.click('[data-action="invite"]', '.smart-dropdown-container');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.see('Author', '.permissions-view .row .role');
        I.click('Close', '.modal-dialog');
        if (i === 1) I.logout();
    }
});

Scenario('[C8379] Add a file', async (I, users) => {
    // Testrail description:
    // No rights to upload a file, "Viewer" role
    // 1. Try to upload a file (Denied of missing permission)

    const folderName = 'C8379';
    const folder = sharedFolder(folderName, users);
    var defaultFolder = await I.grabDefaultFolder('infostore');
    var newFolder = await I.createFolder(folder, defaultFolder, { user: users[0] });
    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[1] });
    I.waitForElement('.file-list-view.complete');
    I.dontSee('New', '.classic-toolbar');
});

Scenario('[C8381] Lock a file', async (I, users) => {
    // Testrail description:
    // Shared or public folder with other member
    // 1. Choose a file (Popup window)
    // 2. "More"-->"Lock" (File is locked for you)
    // 3. Verify with other user
    var defaultFolder = await I.grabDefaultFolder('infostore');
    var newFolder = await I.createFolder(sharedFolder('C8381', users), defaultFolder, { user: users[0] });
    await I.haveFile(newFolder.data.data, 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[0] });
    I.waitForElement(locate('.filename').withText('document.txt').inside('.list-view'));
    I.click(locate('.filename').withText('document.txt').inside('.list-view'));
    I.clickToolbar('~More actions');
    I.waitForText('Lock');
    I.click('Lock', '.smart-dropdown-container');
    I.waitForText('document.txt (Locked)');
    I.logout();

    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[1] });
    I.waitForText('document.txt (Locked)');
});

Scenario('[C8382] Delete a file', async (I, users) => {
    // Testrail description:
    // Shared or public folder with other member
    // 1. Select a file
    // 2. Delete it (File removed)
    var defaultFolder = await I.grabDefaultFolder('infostore');
    var newFolder = await I.createFolder(sharedFolder('C8382', users), defaultFolder, { user: users[0] });
    await I.haveFile(newFolder.data.data, 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[0] });
    I.waitForElement('.file-list-view.complete');
    I.waitForText('document.txt', 1, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.clickToolbar('~Delete');
    I.waitForText('Do you really want to delete this item?');
    I.click('Delete');
    I.logout();
    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[1] });
    I.waitForElement('.file-list-view.complete');
    I.dontSee('document.txt');
});

Scenario('[C8383] Unlock a file', async (I, users) => {
    // Testrail description:
    // 1. Choose a locked file
    // 2. "More"-- > "Unlock" (File is unlocked)
    // 3. Verify with another user
    var defaultFolder = await I.grabDefaultFolder('infostore');
    var newFolder = await I.createFolder(sharedFolder('C8383', users), defaultFolder, { user: users[0] });
    var data = await I.haveFile(newFolder.data.data, 'e2e/media/files/0kb/document.txt');
    await I.haveLockedFile(data);
    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[0] });
    I.waitForElement(locate('.filename').withText('document.txt (Locked)').inside('.list-view'));
    I.click(locate('.filename').withText('document.txt').inside('.list-view'));
    I.clickToolbar('~More actions');
    I.waitForText('Unlock');
    I.click('Unlock', '.smart-dropdown-container');
    I.waitForText('document.txt');
    I.dontSee('Locked');
    I.logout();

    I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[1] });
    I.waitForElement('.file-list-view.complete');
    I.waitForText('document.txt');
    I.dontSee('Locked');
});

Scenario('[C8385] Uninvite a person', async (I, users) => {
    // Testrail description:
    // Person is invited to the folder
    // 1. Choose a folder
    // 2. Click the gear button (context menu)
    // 3. Choose "Permissions/Invite People" (A new pop up window opens with an overview of the invited people and their permissions.)
    // 4. Click the gear button next to Person B that needs to be deleted from the folder. (Context menue opens.)
    // 5. Click on "Revoke access" (The person disappears from the list.)
    // 6. Log in with Person B. (Person B is logged in.)
    // 7. Go to Drive. (The folder from Person A is not longer visible in the left section in Drive.)
    var defaultFolder = await I.grabDefaultFolder('infostore');
    var newFolder = await I.createFolder(sharedFolder('C8385', users), defaultFolder, { user: users[0] });

    session('Bob', () => {
        I.login('app=io.ox/files&folder=' + newFolder.data.data, { user: users[0] });
    });

    session('Alice', () => {
        I.login('app=io.ox/files', { user: users[0] });
        I.waitForElement('.file-list-view.complete');
        I.selectFolder('My shares');
        I.waitForElement(locate('.displayname').withText('C8385').inside('.list-view'));
        I.seeNumberOfElements('.list-view li.list-item', 1);
        I.click('C8385', '.list-view .displayname');
        I.clickToolbar('Revoke access');
        I.waitForText('Revoked access.');
    });

    session('Bob', () => {
        I.click('#io-ox-refresh-icon');
        I.waitForElement('#io-ox-refresh-icon .fa-spin');
        I.waitForDetached('#io-ox-refresh-icon .fa-spin');

        I.dontSee('Shared files', '.folder-tree');
    });
});
