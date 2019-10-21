/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />
var fs = require('fs');

Feature('Drive');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7886] Enable hidden folders and files', async function (I) {
    await I.haveSetting('io.ox/files//showHidden', true);
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/.hiddenfile.dat');
    await I.haveFolder({ title: '.hiddenfolder', module: 'infostore', parent: infostoreFolderID });
    I.login('app=io.ox/files');
    I.waitForVisible('.list-view.complete');
    //check for hidden file and folder
    I.see('.hiddenfolder', '.list-view');
    I.see('.hiddenfile.dat', '.list-view');
    I.click('#io-ox-settings-topbar-icon');
    I.waitForVisible('.settings-detail-pane');
    I.click('.folder-node[title="Drive"]');
    I.waitForVisible({ css: '[data-point="io.ox/files/settings/detail/view"]' });
    I.click('Show hidden files and folders');
    I.openApp('Drive');
    I.waitForElement('.list-view.complete');
    I.click('~Refresh');
    I.waitForElement('#io-ox-appcontrol .fa-spin.fa-refresh');
    I.waitForElement('#io-ox-appcontrol .fa-spin-paused.fa-refresh');
    I.waitForDetached(locate('.filename').withText('.hiddenfolder').inside('.list-view'));
    I.dontSeeElement(locate('.filename').withText('.hiddenfile.dat').inside('.list-view'));
});

Scenario('[C7887] Disable hidden folders and files', async function (I) {
    await I.haveSetting('io.ox/files//showHidden', false);
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/.hiddenfile.dat');
    await I.haveFolder({ title: '.hiddenfolder', module: 'infostore', parent: infostoreFolderID });
    I.login('app=io.ox/files');
    I.waitForVisible('.list-view.complete');
    //check for hidden file and folder
    I.dontSee('.hiddenfolder', '.list-view');
    I.dontSee('.hiddenfile.dat', '.list-view');
    I.click('#io-ox-settings-topbar-icon');
    I.waitForVisible('.folder-node[title="Drive"]');
    I.click('.folder-node[title="Drive"]');
    I.waitForVisible({ css: '[data-point="io.ox/files/settings/detail/view"]' });
    I.click('Show hidden files and folders');
    I.openApp('Drive');
    I.waitForElement('.list-view.complete');
    I.click('~Refresh');
    I.waitForElement('#io-ox-appcontrol .fa-spin.fa-refresh');
    I.waitForElement('#io-ox-appcontrol .fa-spin-paused.fa-refresh');
    I.waitForElement(locate('.filename').withText('.hiddenfolder').inside('.list-view'));
    I.seeElement(locate('.filename').withText('.hiddenfile.dat').inside('.list-view'));
});

Scenario('[C45046] Upload new version', async function (I) {
    //Generate TXT file for upload
    let timestamp1 = Math.round(+new Date() / 1000);
    await fs.promises.writeFile('build/e2e/C45046.txt', timestamp1);
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'build/e2e/C45046.txt');
    I.login('app=io.ox/files');
    I.waitForVisible('.io-ox-files-window');
    I.waitForElement(locate('.filename').withText('C45046.txt'));
    I.click(locate('.filename').withText('C45046.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForText(timestamp1);
    let timestamp2 = Math.round(+new Date() / 1000);
    await fs.promises.writeFile('build/e2e/C45046.txt', timestamp2);
    I.attachFile('.io-ox-viewer input.file-input', 'build/e2e/C45046.txt');
    I.click('Upload');
    I.waitForText(timestamp2);
    I.waitForElement('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForVisible('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.retry(5).click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');
});

Scenario('[C45048] Edit description', async function (I) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, { content: 'file', name: 'C45048.txt' });

    I.login('app=io.ox/files');
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45048.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForText('file', '.plain-text');
    I.click('.io-ox-viewer .description-button');
    I.fillField('.modal-body textarea', 'C45048');
    I.click('Save');
    I.waitForDetached('.modal-body');
    I.see('C45048', '.io-ox-viewer .description');
});

Scenario('[C45052] Delete file', async function (I, users) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');
    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.waitForElement(locate('.filename').withText('testdocument.odt'));
    I.click(locate('.filename').withText('testdocument.odt'));
    I.clickToolbar('~Delete');
    I.waitForElement('.modal');
    I.click('Delete', '.modal');
    I.waitForDetached(locate('.filename').withText('testdocument.odt'));
});

Scenario('[C45061] Delete file versions', async function (I) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    for (let i = 0; i < 5; i++) {
        await I.haveFile(infostoreFolderID, { content: `file ${i + 1}`, name: 'C45061.txt' });
    }
    I.login('app=io.ox/files');
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45061.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.click(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.click({ xpath: '//div[@class="dropdown open"]//a[@href="#"][contains(text(),"View this version")]/..' });
    I.waitForText('file 4', 5, '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.click({ xpath: '//div[@class="dropdown open"]//a[@href="#"][contains(text(),"Delete version")]/..' });
    I.click('Delete version', '.modal-footer');
    I.waitForDetached(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.see('Versions (4)', '.io-ox-viewer .viewer-fileversions');
});

Scenario.skip('[C45062] Change current file version @contentReview', async function (I) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    for (let i = 0; i < 5; i++) {
        await I.haveFile(infostoreFolderID, { content: `file ${i + 1}`, name: 'C45062.txt' });
    }
    I.login('app=io.ox/files');
    I.waitForVisible('.list-view.complete');
    I.click(locate('.filename').withText('C45062.txt'));
    I.clickToolbar('~View');
    I.waitForText('Versions (5)', 5, '.io-ox-viewer .viewer-fileversions');
    I.click('Versions (5)', '.io-ox-viewer .viewer-fileversions');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.waitForText('View this version', 5, '.dropdown.open');
    I.click('View this version', '.dropdown.open');
    I.waitForText('file 4', 5, '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.waitForText('Make this the current version', 5, '.dropdown.open');
    I.click('Make this the current version', '.dropdown.open');
    // I really don't know what to wait for. Version table "flickers" during reordering. Wait for it to finish.
    I.wait(2);
    I.click('.io-ox-viewer .current.dropdown-toggle');
    I.waitForText('View this version', 5, '.dropdown.open');
    I.click('View this version', '.dropdown.open');
    I.waitForText('file 4', 5, '.plain-text');
});

Scenario.skip('[C45063] Delete current file version @contentReview', async function (I) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    for (let i = 0; i < 5; i++) {
        await I.haveFile(infostoreFolderID, { content: `file ${i + 1}`, name: 'C45063.txt' });
    }
    I.login('app=io.ox/files');
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45063.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.click('Versions (5)', '.io-ox-viewer .viewer-fileversions');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.waitForText('View this version', 5, '.dropdown.open');
    I.click('View this version', '.dropdown.open');
    I.waitForText('file 1', 5, '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.waitForText('Delete version', 5, '.dropdown.open');
    I.click('Delete version', '.dropdown.open');
    I.waitForElement('.modal');
    I.click('Delete version', '.modal-footer');
    I.waitForDetached(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.see('Versions (4)', '.io-ox-viewer .viewer-fileversions');
});
