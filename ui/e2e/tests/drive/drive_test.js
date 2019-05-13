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
const { expect } = require('chai');

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
    await I.haveFolder('.hiddenfolder', 'infostore', infostoreFolderID);
    I.login('app=io.ox/files');
    I.waitForVisible('.list-view.complete');
    //check for hidden file and folder
    I.see('.hiddenfolder', '.list-view');
    I.see('.hiddenfile.dat', '.list-view');
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('.open [data-name="io.ox/settings"]');
    I.click('.folder-node[title="Drive"]');
    I.waitForVisible('[data-point="io.ox/files/settings/detail/view"]');
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
    await I.haveFolder('.hiddenfolder', 'infostore', infostoreFolderID);
    I.login('app=io.ox/files');
    I.waitForVisible('.list-view.complete');
    //check for hidden file and folder
    I.dontSee('.hiddenfolder', '.list-view');
    I.dontSee('.hiddenfile.dat', '.list-view');
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('.open [data-name="io.ox/settings"]');
    I.waitForVisible('.folder-node[title="Drive"]');
    I.click('.folder-node[title="Drive"]');
    I.waitForVisible('[data-point="io.ox/files/settings/detail/view"]');
    I.click('Show hidden files and folders');
    I.openApp('Drive');
    I.waitForElement('.list-view.complete');
    I.click('~Refresh');
    I.waitForElement('#io-ox-appcontrol .fa-spin.fa-refresh');
    I.waitForElement('#io-ox-appcontrol .fa-spin-paused.fa-refresh');
    I.waitForElement(locate('.filename').withText('.hiddenfolder').inside('.list-view'));
    I.seeElement(locate('.filename').withText('.hiddenfile.dat').inside('.list-view'));
});

Scenario.skip('[C45046] Upload new version', async function (I, users) {
    //Generate TXT file for upload
    const os = require('os');
    let timestamp1 = Math.round(+new Date() / 1000);
    console.log(os.tmpdir());
    fs.writeFile(os.tmpdir() + '/C45046.txt', timestamp1, function (err) {
        if (err) console.log(err);
    });
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, os.tmpdir() + '/C45046.txt');
    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.waitForElement(locate('.filename').withText('C45046.txt'));
    I.click(locate('.filename').withText('C45046.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForText(timestamp1);
    let timestamp2 = Math.round(+new Date() / 1000);
    await fs.writeFile(os.tmpdir() + '/C45046.txt', timestamp2, function (err) {
        if (err) console.log(err);
    });
    I.wait(2);
    I.attachFile('.io-ox-viewer input.file-input', os.tmpdir() + '/C45046.txt');
    I.click('Upload');
    I.waitForText(timestamp2);
    I.waitForElement('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForVisible('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');
});

Scenario.skip('[C45048] Edit description', async function (I, users) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    //generate -> uploade -> delete  -- File
    await fs.writeFile('e2e/media/files/tmp/C45048.txt', 'file', function (err) {
        if (err) console.log(err);
    });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/tmp/C45048.txt');
    await fs.unlinkSync('e2e/media/files/tmp/C45048.txt');


    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45048.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForText('file', '.plain-text');
    I.click('.io-ox-viewer .description-button');
    I.fillField('.modal-body textarea', 'C45048');
    I.click('Save');
    I.waitForDetached('.modal-body');
    expect(await I.grabTextFrom('.io-ox-viewer .description')).to.equal('C45048');
});

Scenario('[C45052] Delete file', async function (I, users) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');
    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.waitForElement(locate('.filename').withText('testdocument.odt'));
    I.click(locate('.filename').withText('testdocument.odt'));
    I.clickToolbar('~Delete');
    I.click('Delete');
    I.waitForDetached(locate('.filename').withText('testdocument.odt'));
});

Scenario.skip('[C45061] Delete file versions', async function (I, users) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });

    let loopcounter = 0;
    let filecount = 5;
    while (loopcounter < filecount) {
        await fs.writeFile('e2e/media/files/tmp/C45061.txt', 'file ' + (loopcounter + 1), function (err) {
            if (err) console.log(err);
        });
        await I.haveFile(infostoreFolderID, 'e2e/media/files/tmp/C45061.txt');
        await fs.unlinkSync('e2e/media/files/tmp/C45061.txt');
        I.wait(0.5);
        loopcounter++;
    }
    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45061.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
    I.click(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(' + (2 + 2) + ') .dropdown-toggle'));
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"View this version")]/..');
    I.waitForText('file 4', '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(' + (2 + 2) + ') .dropdown-toggle'));
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"Delete version")]/..');
    I.click('Delete version', '.modal-footer');
    I.waitForDetached(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
});

Scenario.skip('[C45062] Change current file version', async function (I, users) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });

    let loopcounter = 0;
    let filecount = 5;
    while (loopcounter < filecount) {
        await fs.writeFile('e2e/media/files/tmp/C45062.txt', 'file ' + (loopcounter + 1), function (err) {
            if (err) console.log(err);
        });
        await I.haveFile(infostoreFolderID, 'e2e/media/files/tmp/C45062.txt');
        await fs.unlinkSync('e2e/media/files/tmp/C45062.txt');
        I.wait(0.5);
        loopcounter++;
    }
    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45062.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
    I.click(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(' + (2 + 2) + ') .dropdown-toggle'));
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"View this version")]/..');
    I.waitForText('file 4', '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(' + (2 + 2) + ') .dropdown-toggle'));
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"Make this the current version")]/..');
    I.click('.io-ox-viewer .current.dropdown-toggle');
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"View this version")]/..');
    I.waitForText('file 4', '.plain-text');
});

Scenario.skip('[C45063] Delete current file version', async function (I, users) {
    //Generate TXT file for upload
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });

    let loopcounter = 0;
    let filecount = 2;
    while (loopcounter < filecount) {
        await fs.writeFile('e2e/media/files/tmp/C45063.txt', 'file ' + (loopcounter + 1), function (err) {
            if (err) console.log(err);
        });
        await I.haveFile(infostoreFolderID, 'e2e/media/files/tmp/C45063.txt');
        await fs.unlinkSync('e2e/media/files/tmp/C45063.txt');
        I.wait(0.5);
        loopcounter++;
    }
    I.login('app=io.ox/files', { user: users[0] });
    I.waitForVisible('.io-ox-files-window');
    I.click(locate('.filename').withText('C45063.txt'));
    I.clickToolbar('~View');
    I.waitForElement('.io-ox-viewer');
    I.waitForElement(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
    I.click(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(' + (2 + 2) + ') .dropdown-toggle'));
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"View this version")]/..');
    I.waitForText('file 1', '.plain-text');
    I.click(locate('.io-ox-viewer table.versiontable tr.version:nth-child(' + (2 + 2) + ') .dropdown-toggle'));
    I.click('//div[@class="dropdown open"]//a[@href="#"][contains(text(),"Delete version")]/..');
    I.click('Delete version', '.modal-footer');
    I.waitForDetached(locate('.io-ox-viewer .viewer-fileversions').withText('Versions (' + filecount + ')'));
});
