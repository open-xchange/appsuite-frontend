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
var fs = require('fs');
const path = require('path');
Feature('Drive');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7886] Enable hidden folders and files', async function ({ I, drive }) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await Promise.all([
        I.haveSetting('io.ox/files//showHidden', true),
        I.haveFile(infostoreFolderID, 'e2e/media/files/generic/.hiddenfile.dat'),
        I.haveFolder({ title: '.hiddenfolder', module: 'infostore', parent: infostoreFolderID })
    ]);
    I.login('app=io.ox/files');
    drive.waitForApp();
    //check for hidden file and folder
    I.see('.hiddenfolder', '.list-view');
    I.see('.hiddenfile.dat', '.list-view');

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/files' });
    I.waitForText('Show hidden files and folders');
    I.click('Show hidden files and folders');

    I.openApp('Drive');
    drive.waitForApp();
    I.triggerRefresh();

    I.waitForDetached(locate('.filename').withText('.hiddenfolder').inside('.list-view'));
    I.dontSeeElement(locate('.filename').withText('.hiddenfile.dat').inside('.list-view'));
});

Scenario('[C7887] Disable hidden folders and files', async function ({ I, drive }) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await Promise.all([
        I.haveSetting('io.ox/files//showHidden', false),
        I.haveFile(infostoreFolderID, 'e2e/media/files/generic/.hiddenfile.dat'),
        I.haveFolder({ title: '.hiddenfolder', module: 'infostore', parent: infostoreFolderID })
    ]);
    I.login('app=io.ox/files');
    drive.waitForApp();
    //check for hidden file and folder
    I.dontSee('.hiddenfolder', '.list-view');
    I.dontSee('.hiddenfile.dat', '.list-view');

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/files' });
    I.waitForElement('.settings-detail-pane h1');
    I.click('Show hidden files and folders');
    I.openApp('Drive');
    drive.waitForApp();
    I.triggerRefresh();
    I.waitForElement(locate('.filename').withText('.hiddenfolder').inside('.list-view'));
    I.seeElement(locate('.filename').withText('.hiddenfile.dat').inside('.list-view'));
});

Scenario('[C45046] Upload new version', async function ({ I, drive }) {
    //Generate TXT file for upload
    let timestamp1 = Math.round(+new Date() / 1000).toString();
    const outputPath = path.join(global.codecept_dir, 'build/e2e');
    if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
    const filePath = path.join(outputPath, 'C45046.txt');

    await fs.promises.writeFile(filePath, timestamp1);
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, path.relative(global.codecept_dir, filePath));

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.waitForElement(locate('.filename').withText('C45046.txt'));
    I.click(locate('.filename').withText('C45046.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');

    I.waitForText(timestamp1);
    let timestamp2 = Math.round(+new Date() / 1000).toString();
    await fs.promises.writeFile('build/e2e/C45046.txt', timestamp2);
    I.attachFile('.io-ox-viewer input.file-input', path.relative(global.codecept_dir, filePath));
    I.click('Upload', '.modal-dialog');

    I.waitForText(timestamp2, 30);
    I.waitForText('Versions (2)');
    I.wait(0.2);
    I.waitForVisible({ css: '[aria-label="Close viewer"] .fa-times' }, 10);

    I.retry(5).clickToolbar('~Close viewer');
    I.waitForDetached('.io-ox-viewer', 30);
});

Scenario('[C45048] Edit description', async function ({ I, drive, dialogs }) {
    await I.haveFile(await I.grabDefaultFolder('infostore'), { content: 'file', name: 'C45048.txt' });

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.click(locate('.filename').withText('C45048.txt'));
    I.clickToolbar('~View');
    drive.waitForViewer();
    I.waitForText('file', 5, '.plain-text');

    I.click('.io-ox-viewer .description-button');
    dialogs.waitForVisible();
    I.waitForVisible('textarea', 5, dialogs.locators.body);
    I.fillField('.modal-body textarea', 'C45048');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.see('C45048', '.io-ox-viewer .description');
});

Scenario('[C45052] Delete file', async function ({ I, users, drive, dialogs }) {
    await I.haveFile(await I.grabDefaultFolder('infostore'), 'e2e/media/files/generic/testdocument.odt');
    I.login('app=io.ox/files', { user: users[0] });
    drive.waitForApp();

    I.waitForElement(locate('.filename').withText('testdocument.odt'));
    I.click(locate('.filename').withText('testdocument.odt'));
    I.clickToolbar('~Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached(locate('.filename').withText('testdocument.odt'));
});

Scenario('[C45061] Delete file versions', async function ({ I, drive, dialogs }) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    await Promise.all([...Array(5).keys()].map(i => {
        I.haveFile(infostoreFolderID, { content: `file ${i + 1}`, name: 'C45061.txt' });
    }));

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.click(locate('.filename').withText('C45061.txt'));
    I.clickToolbar('~View');
    drive.waitForViewer();

    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.click(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.waitForElement('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle');
    I.click('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle');

    I.clickDropdown('View this version');
    I.waitForText('file 4', 5, '.plain-text');

    I.waitForElement('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle');
    I.click('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle');
    I.clickDropdown('Delete version');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete version');
    I.waitForDetached('.modal-dialog');

    I.waitForDetached(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.waitForText('Versions (4)', 5, '.io-ox-viewer .viewer-fileversions');
});

Scenario('[C45062] Change current file version', async function ({ I, drive }) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    await Promise.all([...Array(5).keys()].map(i => {
        I.haveFile(infostoreFolderID, { content: `file ${i + 1}`, name: 'C45062.txt' });
    }));

    I.login('app=io.ox/files');
    drive.waitForApp();
    I.click(locate('.filename').withText('C45062.txt'));
    I.clickToolbar('~View');
    I.waitForText('Versions (5)', 5, '.io-ox-viewer .viewer-fileversions');
    I.click('Versions (5)', '.io-ox-viewer .viewer-fileversions');
    I.waitForElement(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.wait(1);
    I.clickDropdown('View this version');
    I.waitForText('file 4', 5, '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle'));
    I.clickDropdown('Make this the current version');
    // wait for version 4 to be sorted to the top (current version is always at the top)
    I.waitForElement('.io-ox-viewer table.versiontable tr.version:nth-child(3)[data-version-number="4"]');
    I.wait(1);
    I.click('.io-ox-viewer .current.dropdown-toggle');
    I.wait(1);
    I.clickDropdown('View this version');
    I.waitForText('file 4', 5, '.plain-text');
});

Scenario('[C45063] Delete current file version', async function ({ I, drive, dialogs }) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore');

    await Promise.all([...Array(5).keys()].map(i => {
        I.haveFile(infostoreFolderID, { content: `file ${i + 1}`, name: 'C45063.txt' });
    }));

    I.login('app=io.ox/files');
    drive.waitForApp();

    I.click(locate('.filename').withText('C45063.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');

    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.click('Versions (5)', '.io-ox-viewer .viewer-fileversions');

    const dropdownToggle = locate('.io-ox-viewer table.versiontable tr.version:nth-child(4) .dropdown-toggle');
    I.waitForElement(dropdownToggle);
    I.click(dropdownToggle);
    I.clickDropdown('View this version');
    I.waitForText('file 4', 5, '.plain-text');

    I.click(dropdownToggle);
    I.clickDropdown('Delete version');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete version');
    I.waitForDetached('.modal-dialog');

    I.waitForDetached(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (5)'));
    I.waitForText('Versions (4)', 5, '.io-ox-viewer .viewer-fileversions');
});
