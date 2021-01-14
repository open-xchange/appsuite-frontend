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

Scenario('[C283261] Adding files with identical names - Add separate file', async ({ I, settings, drive }) => {

    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.rtf');
    await I.haveSetting('io.ox/files//showDetails', true);

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/files']);
    settings.waitForApp();
    I.waitForElement('.io-ox-drive-settings');
    I.checkOption('Add separate file');
    I.openApp('Drive');
    drive.waitForApp();

    //Add file with existing name
    I.clickToolbar('Upload');
    I.waitForText('File');
    I.click('File');
    I.attachFile({ css: '[aria-label="Drive toolbar. Use cursor keys to navigate."] .dropdown input[name=file]' }, 'e2e/media/files/generic/testdocument.rtf');

    //Verify there's no new version of the file
    I.waitForText('testdocument.rtf');
    I.waitForText('testdocument (1).rtf');
    I.click(locate('.filename').withText('testdocument.rtf'));
    I.waitForElement('.viewer-fileversions');
    I.dontSeeElement('.viewer-fileversions'); //Check that Versions doesn't display in Details
    I.click(locate('.filename').withText('testdocument (1).rtf'));
    I.waitForElement('.viewer-fileversions');
    I.dontSeeElement('.viewer-fileversions'); //Check that Versions doesn't display in Details

});


