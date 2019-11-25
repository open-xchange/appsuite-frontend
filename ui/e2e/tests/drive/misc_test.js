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

Scenario('[C114352] Create folder in copy/move dialog', async (I, users, drive) => {
    await I.haveFile(await I.grabDefaultFolder('infostore'), 'e2e/media/files/generic/testdocument.odt');

    // 1. Go to Drive
    I.login('app=io.ox/files');
    drive.waitForApp();

    // 2. Select any file
    I.waitForElement(locate('.filename').withText('testdocument.odt').inside('.list-view'));
    I.click(locate('.filename').withText('testdocument.odt').inside('.list-view'));
    I.waitForVisible('~Details');

    // 3. Open context menu and select "Move"
    I.click('~More actions');
    I.clickDropdown('Move');
    I.waitForText('Move', 5, '.modal');

    // 4. Select "My files" and click "Create folder"
    // "My files" is already selected by default.
    I.click('Create folder');
    I.waitForText('Add new folder');

    // 5. Choose a name and hit "Add"
    I.fillField({ css: '[data-point="io.ox/core/folder/add-popup"] input' }, 'Foobar');
    I.click('Add');
    I.waitForText('Move', 5, '.modal-footer');
    I.waitForText('Foobar', 5, '.modal-body .selected');
    // 6. Select the new folder and "Move"
    // Folder is already selected by default.
    I.wait(1);
    I.click('Move', '.modal-footer');
    I.waitForText('File has been moved');
    I.waitForInvisible('File has been moved');
    I.selectFolder('Foobar');
    I.waitForText('testdocument.odt', 5, '.list-view');
});

Scenario('[C265694] Hidden parent folder hierarchy for anonymous guest users', async (I, users, drive) => {

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

    const myFiles = await I.grabDefaultFolder('infostore');
    const folderA = await I.haveFolder({ title: 'folderA', module: 'infostore', parent: myFiles });
    const folderB = await I.haveFolder({ title: 'folderB', module: 'infostore', parent: folderA });
    await I.haveFolder({ title: 'folderC', module: 'infostore', parent: folderB });

    I.login('app=io.ox/files');
    drive.waitForApp();
    I.waitForElement(locate('.list-item').withText('folderA').inside('.list-view'));
    I.doubleClick(locate('.list-item').withText('folderA').inside('.list-view'));
    I.waitForElement(locate('.list-item').withText('folderB').inside('.list-view'));
    I.doubleClick(locate('.list-item').withText('folderB').inside('.list-view'));
    I.waitForElement(locate('.list-item').withText('folderC').inside('.list-view'));
    I.click(locate('.list-item').withText('folderC').inside('.list-view'));
    I.waitForText('folderC');
    I.click('.list-item[aria-label*="folderC"]');
    drive.shareItem('Create sharing link');
    const url = await I.grabValueFrom('.share-wizard input[type="text"]');
    I.click('Close', '.modal-footer');
    I.logout();

    // 4. Open the sharing link in another browser tab
    I.amOnPage(Array.isArray(url) ? url[0] : url);
    drive.waitForApp();

    I.waitForText('folderC', 5, '.breadcrumb-view');
    I.dontSee('folderA', '.breadcrumb-view');
    I.dontSee('folderB', '.breadcrumb-view');

    I.waitForVisible('.folder-tree');

    I.dontSee('folderA', '.folder-tree');
    I.dontSee('folderB', '.folder-tree');
    I.see('folderC', '.folder-tree');

});

// TODO: shaky (element (.file-list-view.complete) still not present on page after 30 sec)
Scenario.skip('[C257247] Restore deleted items', async (I, drive) => {

    // Preconditions: At least one file and one folder in Drive

    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    await Promise.all([
        I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt'),
        I.haveFolder({ title: 'testfolder', module: 'infostore', parent: infostoreFolderID })
    ]);

    I.login('app=io.ox/files');
    drive.waitForApp();

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
    drive.waitForApp();
    I.waitForElement(locate('.list-item').withText('testfolder').inside('.list-view'));
    I.click(locate('.list-item').withText('testfolder').inside('.list-view'));
    I.waitForVisible('~Details');

    I.click('~More actions');
    I.clickDropdown('Restore');

    I.waitForVisible('.io-ox-alert-info');
    I.see('Restored into folder:');
    I.see('Drive/My files');
    I.click('.io-ox-alert-info .close');
    I.waitForInvisible('.io-ox-alert-info');

    I.selectFolder('My files');
    drive.waitForApp();
    I.waitForElement(locate('.list-item').withText('testfolder').inside('.list-view'));

    // 3. Repeat Step 1 and 2 with a file.

    I.click('.list-item[aria-label*="testdocument.odt"]');
    I.waitForVisible('~Delete');

    I.click('~Delete');
    I.waitForVisible('.modal-dialog');

    I.click('Delete');
    I.waitForInvisible('.modal-dialog');
    I.dontSee('testdocument.odt');

    I.selectFolder('Trash');
    drive.waitForApp();
    I.waitForElement('.list-item[aria-label*="testdocument.odt"]');

    I.click('.list-item[aria-label*="testdocument.odt"]');
    I.waitForVisible('~Details');

    I.click('~More actions');
    I.clickDropdown('Restore');

    I.waitForVisible('.io-ox-alert-info');
    I.see('Restored into folder:');
    I.see('Drive/My files');
    I.click('.io-ox-alert-info .close');
    I.waitForInvisible('.io-ox-alert-info');

    I.selectFolder('My files');
    drive.waitForApp();
    I.triggerRefresh();
    I.waitForText('testdocument.odt', 5, '.list-view');

});

Scenario('Logout right before running into error storing data in JSLob', async (I) => {
    await I.haveSetting('io.ox/files//viewOptions',
        [...Array(2500)]
        .map(() => ({ sort: 702, order: 'ASC', layout: 'list' }))
        .reduce(function (acc, val, ix) {
            acc[ix + 50] = val;
            return acc;
        }, {})
    );
    I.login('app=io.ox/files');
    I.clickToolbar('Sort by');
    I.clickDropdown('Date');
    I.logout();
});
