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

Feature('Contacts > Edit');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async function ({ users }) {
    await users.removeAll();
});


Scenario('[C7365] Edit permission ', async ({ I, contacts, users, dialogs }) => {

    // #1 Login, open address book
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.click('.folder-arrow', '~My address books');
    I.openFolderMenu('Contacts');

    // #2 Open permission / sharing dialog for contacts folder and add internal user
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForVisible('.permission-pre-selection .btn');
    I.click('.permission-pre-selection .btn');
    I.clickDropdown('Author');
    I.waitForDetached('.dropdown.open');
    I.click('~Select contacts');
    I.waitForElement('.list-view.address-picker li.list-item');
    I.fillField('Search', users[1].userdata.name);
    I.waitForText(users[1].userdata.name, 5, '.address-picker');
    I.click('.address-picker .list-item');
    I.click({ css: 'button[data-action="select"]' });
    I.waitForDetached('.address-picker');
    I.waitForElement(locate('.permissions-view .row').at(2));
    // #3 save it

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #4 verify with the internal user
    const sharedUserName = `${users[0].get('sur_name')}, ${users[0].get('given_name')}`;
    const secondUserName = `${users[1].get('sur_name')}, ${users[1].get('given_name')}`;
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.click('.folder-arrow', '~Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForText('Author', 5, locate('.permission.row').withAttr({ 'aria-label': `${secondUserName}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #5 change permission from author to viewer
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.selectFolder('Contacts');
    I.openFolderMenu('Contacts');
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();

    I.click('Author', locate('.permission.row').withAttr({ 'aria-label': `${secondUserName}, Internal user.` }));
    I.clickDropdown('Viewer');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #6 verify
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForText('Viewer', 5, locate('.permission.row').withAttr({ 'aria-label': `${secondUserName}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #7 change permission from author to viewer
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.selectFolder('Contacts');
    I.openFolderMenu('Contacts');
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.click('Viewer', locate('.permission.row').withAttr({ 'aria-label': `${secondUserName}, Internal user.` }));
    I.clickDropdown('Reviewer');
    I.waitForDetached('.dropdown.open');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.waitForNetworkTraffic();
    I.logout();

    // #6 verify
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForText('Reviewer', 5, locate('.permission.row').withAttr({ 'aria-label': `${secondUserName}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
});
