/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

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

Scenario('[C83383] mail folders using “Permisions” dialog', async ({ I, users, dialogs }) => {
    const busystate = locate('.modal modal-body.invisible');
    // Alice shares a mail folder
    I.login('app=io.ox/mail');
    I.waitForText('Spam', 5, '.folder-tree');
    I.selectFolder('Spam');
    I.openFolderMenu('Spam');
    I.clickDropdown('Permissions');
    I.waitForText('Permissions for folder');
    I.waitForDetached(busystate);
    I.wait(0.5);

    I.click('~Select contacts');
    dialogs.waitForVisible();
    I.waitForElement('.modal .list-view.address-picker li.list-item');
    I.fillField('Search', users[1].get('name'));
    I.waitForText(users[1].get('name'), 5, '.address-picker');
    I.waitForText(users[1].get('primaryEmail'));
    I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
    I.click({ css: 'button[data-action="select"]' });
    I.waitForElement(locate('.permissions-view .row').at(2));
    I.waitForText('Viewer');
    I.fillField('.form-control.message-text', 'Hello');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.logout();

    // Bob receives the share
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForText('has shared the folder', undefined, '.list-view');
    I.click(locate('li.list-item'));
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText('View folder');
        I.click('View folder');
    });
    I.waitForText('Empty', 5, '.list-view');
    I.waitForText(`${users[0].get('name')}`, 10, '.folder-tree');
    I.see('Spam', '.folder-tree [data-id="default0/shared"]');
});
