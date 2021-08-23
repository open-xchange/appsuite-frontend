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

Scenario('[C7481] Add a file', async ({ I, users, portal }) => {
    // Add a file to portal
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');

    //Add Recently changed files widget to Portal
    I.login('app=io.ox/portal');
    portal.waitForApp();
    portal.addWidget('Recently changed files');
    I.waitForElement('~Recently changed files');
    I.waitForText('testdocument.odt', 5, '.widget[aria-label="Recently changed files"]');
    I.click('.item .title', '.widget[aria-label="Recently changed files"]');

    //Open file in viewer
    I.waitForElement('.io-ox-viewer');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .filename-label');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .viewer-sidebar-pane .file-name');
    I.click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');
});

