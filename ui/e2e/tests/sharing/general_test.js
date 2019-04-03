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

Scenario('[C45032] Edit Permissions at "My shares"', async function (I, users) {
    await users.create();
    session('Alice', () => {
        I.login('app=io.ox/files');

        I.selectFolder('My shares');
        I.seeNumberOfElements('.list-view li.list-item', 0);

        //I.shareFolder('Music');
        I.click('My files', '.folder-tree');
        I.selectFolder('Music');
        I.clickToolbar('Share');
        I.click('Invite people');
        I.waitForText('Share folder');
        I.click('Send notification by email');
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
        I.waitForText('Viewer', '.dropdown');
        I.click('Viewer');
        I.click('Share', '.modal');

        I.selectFolder('My shares');
        I.waitForElement(locate('.displayname').withText('Music').inside('.list-view'));
        I.seeNumberOfElements('.list-view li.list-item', 1);
        I.see('Music', '.list-view');

        I.click('Music', '.list-view .displayname');
    });

    session('Bob', () => {
        I.login('app=io.ox/files', { user: users[1] });
        I.waitForText('Shared files', 5, '.folder-tree');
        I.selectFolder('Shared files');
        I.waitForText(users[0].get('name'));
        I.selectFolder(users[0].get('name'));
        I.waitForText('Music', 5, '.list-view');
        I.selectFolder('Music');
        I.wait(0.2);
        I.dontSee('New', '.classic-toolbar');
        I.selectFolder(users[0].get('name'));
    });

    session('Alice', () => {
        I.click('Edit share');
        I.waitForText('Share folder');
        I.click('Send notification by email');
        I.dontSeeCheckboxIsChecked('Send notification by email');
        I.click('Viewer');
        I.waitForText('Author', '.dropdown');
        I.click('Author');
        I.click('Share', '.modal');
    });

    session('Bob', () => {
        I.click('#io-ox-refresh-icon');
        I.waitForElement('#io-ox-refresh-icon .fa-spin');
        I.waitForDetached('#io-ox-refresh-icon .fa-spin');

        I.selectFolder('Music');
        I.clickToolbar('New');
        I.click('Add new folder');
        I.waitForText('Add new folder');
        I.fillField('Folder name', 'Hello from Bob');
        I.click('Add');
    });

    session('Alice', () => {
        I.selectFolder('My folders');
        I.selectFolder('Music');

        //I.refreshData, triggerRefresh, …
        I.click('#io-ox-refresh-icon');
        I.waitForElement('#io-ox-refresh-icon .fa-spin');
        I.waitForDetached('#io-ox-refresh-icon .fa-spin');

        I.see('Hello from Bob', '.list-view');
    });
});
