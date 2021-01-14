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
/// <reference path="../../steps.d.ts" />

Feature('Drive > General');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8365] Version history', async ({ I, drive }) => {
    var fs = require('fs');

    let timestamp1 = Math.round(+new Date() / 1000);
    await fs.promises.writeFile('build/e2e/C8365.txt', `timestamp1: ${timestamp1}`);
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'build/e2e/C8365.txt');
    await I.haveSetting('io.ox/files//showDetails', true);

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.waitForElement(locate('.filename').withText('C8365.txt'));
    I.click(locate('.filename').withText('C8365.txt'));

    //Upload new version
    let timestamp2 = Math.round(+new Date() / 1000);
    await fs.promises.writeFile('build/e2e/C8365.txt', `timestamp2: ${timestamp2}`);
    I.waitForElement('.file-input');
    I.attachFile('.file-input', 'build/e2e/C8365.txt');
    I.click('Upload', '.modal-dialog');

    //Verify there's new version of the file
    I.waitForText('Versions (2)');
    I.waitForVisible('.viewer-fileversions.sidebar-panel .panel-toggle-btn');
    I.waitForEnabled('.viewer-fileversions.sidebar-panel .panel-toggle-btn');
    I.retry(5).click('.viewer-fileversions.sidebar-panel .panel-toggle-btn');
    I.waitForElement('.versiontable.table');
    I.waitNumberOfVisibleElements('tr.version', 2, 10);

    //Edit file and save it
    let timestamp3 = Math.round(+new Date() / 1000);
    I.click(locate('.filename').withText('C8365.txt'));
    I.clickToolbar('Edit');
    I.waitForElement('.io-ox-editor');
    I.waitForVisible('.content.form-control');
    I.waitForEnabled('.content.form-control');
    I.fillField('.content', timestamp3);
    I.seeInField('.content', timestamp3);
    I.click('Save');
    I.waitForNetworkTraffic();
    I.wait(1);
    I.click('Close');
    I.waitForDetached('.io-ox-editor');

    //Verify there's new version of the file
    I.waitForText('Versions (3)', 15);
    I.waitForElement('.versiontable.table');
    I.waitNumberOfVisibleElements('tr.version', 3, 10);

});
