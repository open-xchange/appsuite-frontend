/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Olena Stute <olena.stute@open-xchange.com>
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
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .viewer-sidebar-pane .file-name span');
    I.click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');
});

