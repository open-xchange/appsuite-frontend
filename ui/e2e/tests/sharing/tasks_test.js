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

// TODO: shaky (element (body) is not in DOM or there is no element(body) with text "The share you are looking for does not exist." after 30 sec)
Scenario.skip('[C104304] tasks using “Permisions” dialog and sharing link', async ({ I, users, tasks, mail, dialogs }) => {
    let url;
    // Alice shares a folder with 2 tasks
    await session('Alice', async () => {
        I.login('app=io.ox/tasks');
        tasks.waitForApp();

        tasks.newTask();
        I.fillField('Subject', 'simple task 1');
        I.fillField('Description', 'world domination');
        tasks.create();

        tasks.newTask();
        I.fillField('Subject', 'simple task 2');
        I.fillField('Description', 'peace on earth');
        tasks.create();

        I.openFolderMenu('Tasks');
        I.clickDropdown('Share / Permissions');
        I.waitForText('Permissions for folder');

        I.click('~Select contacts');
        dialogs.waitForVisible();
        I.waitForVisible('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.waitForText(users[1].get('primaryEmail'));
        I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
        I.click({ css: 'button[data-action="select"]' });
        I.waitForVisible(locate('.permissions-view .row').at(2));
        I.click('Author', '.share-pane');
        I.waitForText('Viewer', 5, '.dropdown');
        I.click('Viewer');

        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.openFolderMenu('Tasks');
        I.clickDropdown('Share');
        dialogs.waitForVisible();
        I.waitForText('Invited people only', 5);
        I.selectOption('Who can access this folder?', 'Anyone with the public link and invited people');
        I.waitForText('Copy link', 5);
        I.click('Copy link');
        I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
        url = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
        url = Array.isArray(url) ? url[0] : url;
        dialogs.clickButton('Share');
        I.waitForDetached('.modal-dialog');
    });

    // Bob receives the share
    session('Bob', () => {
        I.login('app=io.ox/mail', { user: users[1] });
        mail.waitForApp();
        I.waitForText('has shared the folder', undefined, '.list-view');
        I.click(locate('li.list-item'));
        I.waitForElement('.mail-detail-frame');

        within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View folder');
            I.click('View folder');
        });

        tasks.waitForApp();
        I.waitForElement(`.folder-tree .contextmenu-control[title*="${users[0].get('sur_name')}, ${users[0].get('given_name')}: Tasks`);
        I.waitForText('simple task 1', 5, '.io-ox-tasks-main .vgrid');
        I.seeNumberOfElements('.io-ox-tasks-main .vgrid li.vgrid-cell', 2);
        I.see('simple task 2');
        // at least we can not create or edit elements in the folder, so we assume it's read only
        I.see('New', '.classic-toolbar a.disabled');
        I.see('Edit', '.classic-toolbar a.disabled');
    });

    // Eve uses external link to shared folder
    session('Eve', () => {
        I.amOnPage(url);
        I.waitForElement(`.folder-tree .contextmenu-control[title*="${users[0].get('sur_name')}, ${users[0].get('given_name')}: Tasks`);
        I.waitForText('simple task 1', undefined, '.io-ox-tasks-main .vgrid');
        I.seeNumberOfElements('.io-ox-tasks-main .vgrid li.vgrid-cell', 2);
        I.see('simple task 2');
        // at least we can not create or edit elements in the folder, so we assume it's read only
        I.see('New', '.classic-toolbar a.disabled');
        I.see('Edit', '.classic-toolbar a.disabled');
    });

    session('Alice', () => {
        I.openFolderMenu('Tasks');
        I.clickDropdown('Share / Permissions');
        I.waitForElement('.btn[title="Actions"]');
        I.click('.btn[title="Actions"]');
        I.clickDropdown('Revoke access');
        dialogs.waitForVisible();
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.click({ css: '.folder-tree [title="Actions for Tasks"]' });
        I.clickDropdown('Share');
        dialogs.waitForVisible();
        I.waitForText('Invited people only', 5);
        I.selectOption('Who can access this folder?', 'Anyone with the public link and invited people');
        I.waitForText('Copy link', 5);
        dialogs.clickButton('Cancel');
        I.waitForDetached('.modal-dialog');
    });

    session('Bob', () => {
        I.triggerRefresh();

        // folder is still in the folder tree, needs hard refresh to get the latest state
        I.dontSee('simple task 1');
        I.dontSee('simple task 2');
    });

    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('The share you are looking for does not exist.');
    });
});
