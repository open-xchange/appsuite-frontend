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

Scenario('[C45022] Generate simple link for sharing with password', async function (I) {
    I.login('app=io.ox/files');
    I.click('My files', '.folder-tree');
    I.selectFolder('Music');
    I.clickToolbar('Share');
    I.click('Create sharing link');
    I.waitForText('Sharing link created for folder');
    I.click('Password required');
    I.seeCheckboxIsChecked('Password required');
    I.fillField('Enter Password', 'CorrectHorseBatteryStaple');
    const [url] = await I.grabValueFrom('.share-wizard input[type="text"]');
    I.click('Close');
    I.logout();
    I.amOnPage(url);
    I.waitForFocus('input[name="password"]');
    I.fillField('Password', 'CorrectHorseBatteryStaple');
    I.click('Sign in');
    I.waitForElement('.list-view');
    I.see('Music', '.folder-tree .selected');
});

Scenario('[C83385] Copy to clipboard', async function (I) {
    I.login('app=io.ox/files');
    I.click('My files', '.folder-tree');
    I.selectFolder('Music');
    I.clickToolbar('Share');
    I.click('Create sharing link');
    I.waitForVisible('.clippy');
    const [url] = await I.grabValueFrom('.share-wizard input[type="text"]');
    I.click('~Copy to clipboard');
    I.see('Copied');

    // write something, so the field gets the focus
    I.fillField('Message (optional)', 'The url: ');
    // now paste what we have in clipboard
    I.pressKey(['Control', 'v']);

    I.seeInField({ css: 'textarea[name="message"]' }, `The url: ${url}`);

    I.click('Close');
    I.logout();
    I.amOnPage(url);
    I.waitForText('Music');
});

Scenario('[C85625] My Shares default sort order @shaky', async function (I, users) {
    function share(I, item) {
        I.click(locate('li.list-item').withText(item));
        I.clickToolbar('Share');
        I.click('Create sharing link');
        I.waitForText('Sharing link created for');
        I.click('Close');

    }
    const { expect } = require('chai');
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    const testFolder = await I.haveFolder('Testfolder', 'infostore', folder, { user: users[0] });
    await I.haveFile(testFolder.data, 'e2e/media/files/0kb/document.txt');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testdocument.rtf');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testdocument.odt');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testpresentation.ppsm');
    I.login('app=io.ox/files&folder=' + folder);
    I.waitForElement('.file-list-view.complete');

    share(I, 'document.txt');
    I.selectFolder('Testfolder');
    share(I, 'testdocument.rtf');
    share(I, 'testpresentation.ppsm');
    I.selectFolder('My files');
    share(I, 'Testfolder');

    I.selectFolder('My shares');
    const itemNames = (await I.grabTextFrom(locate('li.list-item'))).map((line) => line.split('\n')[0]);
    expect(itemNames).to.deep.equal(['Testfolder', 'testpresentation.ppsm', 'testdocument.rtf', 'document.txt']);
    I.click('Sort by');
    I.seeElement(locate('i.fa-check').inside(locate('.dropdown a').withText('Date')));
    I.seeElement(locate('i.fa-check').inside(locate('.dropdown a').withText('Descending')));
    I.pressKey('ESC');
});
