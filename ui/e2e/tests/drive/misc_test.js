/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Drive > Misc');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C114352] Create folder in copy/move dialog @shaky', async (I, users) => {

    // Preconditions: At least one file in Drive

    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });

    I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');

    // 1. Go to Drive

    I.login('app=io.ox/files');

    // 2. Select any file

    I.click('.list-item[aria-label*="testdocument.odt"]');
    I.waitForVisible('~Details');

    // 3. Open context menu and select "Move"

    I.click({ css: '[data-original-title="More actions"]' });
    I.waitForVisible('.smart-dropdown-container');

    I.click('Move');
    I.waitForText('Move');

    // 4. Select "My files" and click "Create folder"

    // "My files" is already selected by default.
    I.click('Create folder');
    I.waitForText('Add new folder');

    // 5. Choose a name and hit "Add"

    I.fillField({ css: '[data-point="io.ox/core/folder/add-popup"] input' }, 'Foobar');
    I.click('Add');
    I.waitForText('Move');
    I.see('Foobar');

    // 6. Select the new folder and "Move"

    // Folder is already selected by default.
    I.click('Move', { css: '[data-point="io.ox/core/folder/picker"]' });
    I.wait(1);
    I.doubleClick('.list-item[aria-label*="Foobar"]');
    I.wait(2);
    I.see('testdocument.odt');

});

Scenario('[C265694] Hidden parent folder hierarchy for anonymous guest users', async (I, users) => {

    /*
     * Preconditions:
     *
     * The following folder structure is available in Drive
     *
     * └─ My files
     * ---└─ A
     * ------└─ B
     * ---------└─ C
     *
     */

    const myFiles = await I.grabDefaultFolder('infostore', { user: users[0] });

    const folderA = await I.haveFolder({ title: 'folderA', module: 'infostore', parent: myFiles });
    const folderB = await I.haveFolder({ title: 'folderB', module: 'infostore', parent: folderA });
    await I.haveFolder({ title: 'folderC', module: 'infostore', parent: folderB });

    // 1. Login

    I.login();

    // 2. Go to Drive

    I.openApp('Drive');

    // 3. Create a sharing link for folder 'C'
    I.waitForText('folderA');
    I.doubleClick('.list-item[aria-label*="folderA"]');

    I.waitForText('folderB');
    I.doubleClick('.list-item[aria-label*="folderB"]');

    I.waitForText('folderC');
    I.click('.list-item[aria-label*="folderC"]');

    I.click('Share');
    I.waitForVisible('.dropdown-menu');

    I.click('Create sharing link');
    I.waitForText('Sharing link created for folder');

    const [url] = await I.grabValueFrom('.share-wizard input[type="text"]');

    I.click('Close');

    I.logout();

    // 4. Open the sharing link in another browser tab

    I.amOnPage(url);

    I.waitForVisible('.breadcrumb-view');

    I.dontSee('folderA', '.breadcrumb-view');
    I.dontSee('folderB', '.breadcrumb-view');
    I.see('folderC', '.breadcrumb-view');

    I.waitForVisible('.folder-tree');

    I.dontSee('folderA', '.folder-tree');
    I.dontSee('folderB', '.folder-tree');
    I.see('folderC', '.folder-tree');

});

Scenario('[C257247] Restore deleted items @shaky', async (I, users) => {

    // Preconditions: At least one file and one folder in Drive

    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });

    I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');
    I.haveFolder({ title: 'testfolder', module: 'infostore', parent: infostoreFolderID });

    I.login('app=io.ox/files');

    // 1. Delete the folder

    I.click('.list-item[aria-label*="testfolder"]');
    I.waitForVisible('~Delete');

    I.click('~Delete');
    I.waitForVisible('.modal-dialog');

    I.click('Delete');
    I.waitForInvisible('.modal-dialog');
    I.dontSee('testfolder');

    // 2. Switch to Trash, select the previously deleted folder and use "restore" from the toolbar Expected Result

    I.selectFolder('Trash');
    I.wait(1); // Wait for thre list view to refresh
    I.see('testfolder');

    I.click('.list-item[aria-label*="testfolder"]');
    I.waitForVisible('~Details');

    I.click({ css: '[data-original-title="More actions"]' });
    I.waitForVisible('.smart-dropdown-container');
    I.see('Restore');

    I.click('Restore');
    I.waitForVisible('.io-ox-alert-info');
    I.see('Restored into folder:');
    I.see('Drive/My files');
    I.waitForInvisible('.io-ox-alert-info');

    I.selectFolder('My files');
    I.wait(1); // Wait for thre list view to refresh
    I.see('testfolder');

    // 3. Repeat Step 1 and 2 with a file.

    I.click('.list-item[aria-label*="testdocument.odt"]');
    I.waitForVisible('~Delete');

    I.click('~Delete');
    I.waitForVisible('.modal-dialog');

    I.click('Delete');
    I.waitForInvisible('.modal-dialog');
    I.dontSee('testdocument.odt');

    I.selectFolder('Trash');
    I.wait(1); // Wait for thre list view to refresh
    I.see('testdocument.odt');

    I.click('.list-item[aria-label*="testdocument.odt"]');
    I.waitForVisible('~Details');

    I.click({ css: '[data-original-title="More actions"]' });
    I.waitForVisible('.smart-dropdown-container');
    I.see('Restore');

    I.click('Restore');
    I.waitForVisible('.io-ox-alert-info');
    I.see('Restored into folder:');
    I.see('Drive/My files');
    I.waitForInvisible('.io-ox-alert-info');

    I.selectFolder('My files');
    I.wait(1); // Wait for thre list view to refresh
    I.see('testdocument.odt');

});
