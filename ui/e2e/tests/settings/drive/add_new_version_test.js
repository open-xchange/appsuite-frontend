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
 *
 */
/// <reference path="../../../steps.d.ts" />

Feature('Settings > Drive');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C283259] Adding files with identical names - Add new version', async ({ I, settings, drive }) => {

    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.rtf');
    await I.haveSetting('io.ox/files//showDetails', true);

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/files']);
    settings.waitForApp();
    I.waitForElement('.io-ox-drive-settings');
    I.checkOption('.sr-only[value="newVersion"]');
    I.openApp('Drive');
    drive.waitForApp();

    //Add file with existing name
    I.clickToolbar('New');
    I.waitForText('Upload files');
    I.click('Upload files');
    I.attachFile({ css: '[aria-label="Drive toolbar. Use cursor keys to navigate."] .dropdown input[name=file]' }, 'e2e/media/files/generic/testdocument.rtf');
    I.waitForText('testdocument.rtf');

    //Verify there's new version of the file
    I.dontSee('testdocument.rtf(1)');
    I.waitForElement('.viewer-fileversions');
    I.see('Versions (2)', '.viewer-fileversions');
    I.click('.viewer-fileversions.sidebar-panel', '.viewer-sidebar');
    I.waitForElement('.versiontable.table');
    I.seeElement('~testdocument.rtf', '.versiontable.table');
    I.seeNumberOfElements('tr.version', 2);


});
