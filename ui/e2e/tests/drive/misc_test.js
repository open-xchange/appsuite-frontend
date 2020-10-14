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

Scenario('[C114352] Create folder in copy/move dialog', async (I, users, drive, dialogs) => {
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
    dialogs.waitForVisible();
    I.waitForText('Move', 5, dialogs.locators.header);

    // 4. Select "My files" and click "Create folder"
    // "My files" is already selected by default.
    dialogs.clickButton('Create folder');
    I.waitForText('Add new folder', 5, dialogs.locators.header);

    // 5. Choose a name and hit "Add"
    I.fillField({ css: '[data-point="io.ox/core/folder/add-popup"] input' }, 'Foobar');
    dialogs.clickButton('Add');
    I.waitForText('Move', 5, dialogs.locators.header);
    I.waitForElement('.selected[aria-label="Foobar"]');

    // 6. Select the new folder and "Move"
    // Folder is already selected by default.
    dialogs.clickButton('Move');
    I.waitForText('File has been moved');
    I.waitForInvisible('File has been moved');
    I.selectFolder('Foobar');
    I.waitForText('testdocument.odt', 5, '.list-view');
});

Scenario('[C265694] Hidden parent folder hierarchy for anonymous guest users', async (I, users, drive, dialogs) => {

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

    // Doubleclick through folders in listview until we reach the end (folderC)
    I.waitForElement(locate('.list-item').withText('folderA').inside('.list-view'));
    I.doubleClick(locate('.list-item').withText('folderA').inside('.list-view'));
    I.waitForElement(locate('.list-item').withText('folderB').inside('.list-view'));
    I.doubleClick(locate('.list-item').withText('folderB').inside('.list-view'));
    I.waitForElement(locate('.list-item').withText('folderC').inside('.list-view'));
    I.click(locate('.list-item').withText('folderC').inside('.list-view'));

    I.click('Share');
    dialogs.waitForVisible();
    I.waitForText('Invited people only', 5);
    I.selectOption('Who can access this folder?', 'Anyone with the link and invited people');
    I.waitForText('Copy link', 5);
    I.click('Copy link');
    const url = await I.grabValueFrom('.public-link-url-input');
    dialogs.clickButton('Share');

    I.waitForDetached('.modal-dialog');
    I.logout();

    // Open the sharing link in another browser tab
    I.amOnPage(Array.isArray(url) ? url[0] : url);
    drive.waitForApp();

    I.waitForText('folderC', 5, '.breadcrumb-view');
    I.dontSee('folderA', '.breadcrumb-view');
    I.dontSee('folderB', '.breadcrumb-view');

    I.dontSee('folderA', '.folder-tree');
    I.dontSee('folderB', '.folder-tree');
    I.see('folderC', '.folder-tree');

});

// TODO: @bug 68484 - unskip when fixed from backend
Scenario.skip('[C257247] Restore deleted items', async (I, drive, dialogs) => {

    // Preconditions: At least one file and one folder in Drive

    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    await Promise.all([
        I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt'),
        I.haveFolder({ title: 'testfolder', module: 'infostore', parent: infostoreFolderID })
    ]);

    I.login('app=io.ox/files');
    drive.waitForApp();

    deleteFolder('testfolder'); // 1. Delete the folder
    restoreFolder('testfolder'); // 2. Switch to Trash, select the previously deleted folder and use "restore" from the toolbar

    deleteFile('testdocument.odt'); // 1. Delete the file
    restoreFile('testdocument.odt'); // 2. Switch to Trash, select the previously deleted file and use "restore" from the toolbar

    I.selectFolder('My files');
    I.triggerRefresh();
    I.waitForText('testdocument.odt', 5, '.list-view');

    //----------------------------------------------------------

    function deleteFile(name) {
        I.selectFolder('My files');
        drive.waitForApp();
        I.click(`.list-item[aria-label*="${name}"]`);

        I.waitForVisible('~Delete');
        I.click('~Delete');

        dialogs.waitForVisible();
        dialogs.clickButton('Delete');
        I.waitForDetached('.modal-dialog');

        I.dontSee(`${name}`);
    }

    function restoreFile(name) {
        I.selectFolder('Trash');
        drive.waitForApp();
        I.waitForElement(locate('.list-item').withText(`${name}`).inside('.list-view'));
        I.click(locate('.list-item').withText(`${name}`).inside('.list-view'));
        I.waitForVisible('~Details');

        I.clickToolbar('~More actions');
        I.clickDropdown('Restore');

        I.waitForVisible('.io-ox-alert-info');
        I.see('Restored into folder:', '.io-ox-alert-info');
        I.see('Drive/My files', '.io-ox-alert-info');
        I.click('.io-ox-alert-info .close');
        I.waitForDetached('.io-ox-alert-info');
    }

    function deleteFolder(name) {
        return deleteFile(name);
    }


    function restoreFolder(name) {
        return restoreFile(name);
    }

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

Scenario('[Bug 61823] Drive shows main folder content instead of content from selected folder', async (I, drive, dialogs) => {
    const defaultFolder = await I.grabDefaultFolder('infostore');
    const testFolder1 = await I.haveFolder({ title: 'testFolder1', module: 'infostore', parent: defaultFolder });
    const testFolder2 = await I.haveFolder({ title: 'testFolder2', module: 'infostore', parent: defaultFolder });

    await I.haveFile(defaultFolder, 'e2e/media/files/generic/testdocument.odt');
    await I.haveFile(testFolder1, 'e2e/media/files/generic/contact_picture.png');
    await I.haveFile(testFolder2, 'e2e/media/files/generic/testpresentation.ppsm');

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.waitForText('testdocument.odt');

    // delete folder
    I.click('.list-item[aria-label*="testFolder1"]');
    I.waitForVisible('~Delete');
    I.click('~Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    // need to be faster than delete operation (according to bug)
    // automated testing should be fast enough. Network throttling will not help here since there is no upload or download involved in a delete request
    I.selectFolder('testFolder2');
    I.waitForText('testpresentation.ppsm');
    I.dontSee('testdocument.odt');
});
