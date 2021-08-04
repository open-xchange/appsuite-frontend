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

Feature('Portal');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7486] Remove a file', async ({ I, users, portal, dialogs }) => {

    // Add a file to drive
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    //Add a file to portal as a widget
    I.login('app=io.ox/files');
    I.waitForElement('.file-list-view.complete');
    I.click('.file-list-view.complete li.list-item[aria-label^="testdocument.odt"]');

    I.clickToolbar('.io-ox-files-main .classic-toolbar li.more-dropdown');
    I.waitForElement('.dropdown-menu.dropdown-menu-right li >a[data-action="io.ox/files/actions/add-to-portal"]');
    I.click('Add to portal');

    //Verify file widget on Portal
    I.openApp('Portal');
    portal.waitForApp();
    I.waitForElement('~testdocument.odt');
    I.wait(1); // sometimes the widget is clicked causing the viewer to be opened

    // remove file widget from portal
    I.click('~testdocument.odt, Disable widget');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');

    // verify that the file widget is removed
    I.dontSee('~testdocument.odt');
    I.click('Customize this page');
    I.waitForText('Portal settings');
    I.dontSee('testdocument.odt');
});
