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

/// <reference path="../../steps.d.ts" />

Feature('Sharing');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C45021] Generate simple link for sharing', async function (I) {
    I.login('app=io.ox/files');
    I.click('My files', '.folder-tree');
    I.selectFolder('Music');
    I.clickToolbar('Share');
    I.click('Create sharing link');
    I.waitForText('Sharing link created for folder');
    const [url] = await I.grabValueFrom('.share-wizard input[type="text"]');
    I.click('Close');
    I.logout();
    I.amOnPage(url);
    I.waitForElement('.list-view');
    I.dontSee('Documents', '.list-view');
    I.see('Music', '.folder-tree .selected');
});

Scenario('[C252159] Generate link for sharing including subfolders', async function (I) {
    I.login('app=io.ox/files');
    I.click('My files', '.folder-tree');
    I.selectFolder('Music');
    I.clickToolbar('New');
    I.click('Add new folder');
    I.waitForText('Add new folder');
    I.fillField('Folder name', 'A subfolder');
    I.click('Add');
    I.waitToHide('.modal');
    I.click('New');
    I.click('Add new folder');
    I.waitForText('Add new folder');
    I.fillField('Folder name', 'Second subfolder');
    I.click('Add');
    I.selectFolder('My files');
    I.click('[aria-label^="Music"]', '.list-view');
    I.clickToolbar('Share');
    I.click('Create sharing link');
    I.waitForText('Sharing link created for folder');
    I.seeCheckboxIsChecked('Share with subfolders');
    const [url] = await I.grabValueFrom('.share-wizard input[type="text"]');
    I.click('Close');
    I.logout();
    I.amOnPage(url);
    I.waitForText('A subfolder', 5, '.list-view');
    I.seeNumberOfVisibleElements('.list-view li.list-item', 2);
    I.see('Second subfolder');
});
