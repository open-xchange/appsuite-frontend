/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

const fs = require('fs'),
    util = require('util'),
    readdir = util.promisify(fs.readdir);

Feature('Drive > General');

Before(async (I, users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C8362] Add note', (I, drive) => {
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.clickToolbar('New');
    I.click('Add note');
    I.waitForElement({ css: 'input[type="text"].title' });
    I.fillField('Title', 'Test title');
    I.fillField('Note', 'Test body');
    I.click('Save');
    // Wait two seconds to let the node be saved
    I.wait(2);
    I.click('Close');
    I.waitForDetached('textarea.content');
    I.see('Test title.txt');
});

// Bug: File input is not selectable (display: none), which is also a pot. a11y bug
Scenario.skip('[C8364] Upload new file', (I, drive) => {
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.clickToolbar('New');
    I.waitForText('Upload files');
    I.click('Upload files');
    I.attachFile('.dropdown.open input[name=file]', 'e2e/media/files/0kb/document.txt');
    // TODO: Continue when Bug is fixed
});

// Note: This is not accessible H4 and textarea does not have a label
Scenario('[C8366] Edit description', async (I, drive) => {
    await I.haveFile(await I.grabDefaultFolder('infostore'), 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.waitForText('document.txt', 1, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.waitForText('Add a description');
    I.click('Add a description');
    I.waitForElement('.modal-body textarea.form-control');
    I.fillField('.modal-body textarea.form-control', 'Test description');
    I.click('Save');
    I.waitForDetached('.modal-body');
    I.seeTextEquals('Test description', 'div.description');
    I.waitForText('document.txt', '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.waitForText('Edit description');
    I.click('button.description-button');
    I.waitForElement('.modal-body textarea.form-control');
    I.fillField('.modal-body textarea.form-control', 'Test description changed');
    I.click('Save');
    I.waitForDetached('.modal-body');
    I.waitForVisible('div.description');
    I.seeTextEquals('Test description changed', 'div.description');
});

const checkIfFoldersExist = (I, layout) => {
    I.see('Documents', layout);
    I.see('Music', layout);
    I.see('Pictures', layout);
    I.see('Videos', layout);
};

// TODO: Bug in Drive Icon View has html entities in it.
Scenario.skip('[C8368] View change @bug', async (I, drive) => {
    await I.haveFile(await I.grabDefaultFolder('infostore'), 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files');
    drive.waitForApp();
    checkIfFoldersExist(I);
    I.see('document.txt');

    I.clickToolbar('View');
    I.clickDropdown('Icons');
    I.waitForElement('.file-list-view.complete.grid-layout');
    checkIfFoldersExist(I, '.grid-layout');
    I.see('document');

    I.clickToolbar('View');
    I.clickDropdown('Tiles');
    I.waitForElement('.file-list-view.complete.tile-layout');
    checkIfFoldersExist(I, '.tile-layout');

    I.clickToolbar('View');
    I.clickDropdown('List');
    I.waitForElement('.file-list-view.complete');
    checkIfFoldersExist(I);
    I.see('document.txt');
});

const searchFor = (I, query) => {
    I.click('.search-field');
    I.waitForElement('.token-input');
    I.fillField('.token-input', query);
    I.pressKey('Enter');
    I.waitForDetached('.busy-indicator.io-ox-busy');
};

Scenario('[C8369] Search', async (I, drive) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    const testFolder = await I.haveFolder({ title: 'Testfolder', module: 'infostore', parent: folder });
    await Promise.all([
        I.haveFile(testFolder, 'e2e/media/files/0kb/document.txt'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testdocument.rtf'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testdocument.odt'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testpresentation.ppsm')
    ]);
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('Testfolder');
    searchFor(I, 'document.txt');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 1);
    I.click('~Cancel search');
    searchFor(I, 'noneexisting');
    I.waitForText('No matching items found.');
    I.click('~Cancel search');
    searchFor(I, 'd');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 4);
});

Scenario('[C8371] Delete file', async (I, drive) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.waitForText('document.txt', undefined, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.clickToolbar('~Delete');
    I.waitForText('Do you really want to delete this item?');
    I.click('Delete');
    I.selectFolder('Trash');
    I.waitForText('document.txt', undefined, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.clickToolbar('~Delete forever');
    I.waitForText('Do you really want to delete this item?');
    I.click('Delete');
    I.waitForDetached(locate('li.list-item').withText('document.txt'));
});

Scenario('[C45039] Breadcrumb navigation', async (I, drive) => {
    const parent = await I.haveFolder({ title: 'Folders', module: 'infostore', parent: await I.grabDefaultFolder('infostore') });
    await Promise.all([
        I.haveFolder({ title: 'subfolder1', module: 'infostore', parent }),
        I.haveFolder({ title: 'subfolder2', module: 'infostore', parent })
    ]);
    const subFolder = await I.haveFolder({ title: 'subfolder3', module: 'infostore', parent });
    const subsubFolder = await I.haveFolder({ title: 'subsubfolder1', module: 'infostore', parent: subFolder });
    await I.haveFolder({ title: 'subsubfolder2', module: 'infostore', parent: subFolder });
    I.login('app=io.ox/files&folder=' + subsubFolder);
    drive.waitForApp();
    I.waitForText('subfolder3', 5, '.breadcrumb-view');
    I.click('subfolder3', '.breadcrumb-view');
    drive.waitForApp();
    I.waitForText('subsubfolder1', 5, '.list-view');
    I.waitForText('subsubfolder2', 5, '.list-view');
    I.click('subsubfolder2', '.list-view');
    I.click('Drive', '.breadcrumb-view');
    drive.waitForApp();
    I.waitForText('Public files', 5, '.list-view');
    I.doubleClick('Public files', '.list-view');
});

const checkFileOrder = (I, files) => {
    files.forEach((name, index) => { I.see(name, '.list-item:nth-child(' + (index + 2) + ')'); });
};

Scenario('[C45040] Sort files', async (I, drive) => {
    const folder = await I.grabDefaultFolder('infostore');
    const testFolder = await I.haveFolder({ title: 'Testfolder', module: 'infostore', parent: folder });
    await Promise.all([
        I.haveFile(testFolder, 'e2e/media/files/0kb/document.txt'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testdocument.rtf'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testdocument.odt'),
        I.haveFile(testFolder, 'e2e/media/files/generic/testpresentation.ppsm')
    ]);
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('Testfolder');
    I.waitForDetached('.io-ox-busy');
    I.waitForText('document.txt', 5, '.list-view');

    // Begins with Name ascending order
    I.say('Name > Ascending');
    checkFileOrder(I, ['document.txt', 'testdocument.odt', 'testdocument.rtf', 'testpresentation.ppsm']);
    I.clickToolbar('Sort by');
    I.click('Descending');
    I.waitForDetached('.io-ox-busy');
    I.say('Name > Descending');
    checkFileOrder(I, ['testpresentation.ppsm', 'testdocument.rtf', 'testdocument.odt', 'document.txt']);

    I.clickToolbar('Sort by');
    I.click('Date');
    I.waitForDetached('.io-ox-busy');
    I.say('Date > Descending');
    checkFileOrder(I, ['testpresentation.ppsm', 'testdocument.odt', 'testdocument.rtf', 'document.txt']);
    I.clickToolbar('Sort by');
    I.click('Ascending');
    I.waitForDetached('.io-ox-busy');
    I.say('Date > Ascending');
    checkFileOrder(I, ['document.txt', 'testdocument.rtf', 'testdocument.odt', 'testpresentation.ppsm']);

    I.clickToolbar('Sort by');
    I.click('Size');
    I.waitForDetached('.io-ox-busy');
    I.say('Size > Ascending');
    checkFileOrder(I, ['document.txt', 'testdocument.odt', 'testpresentation.ppsm', 'testdocument.rtf']);
    I.clickToolbar('Sort by');
    I.click('Descending');
    I.waitForDetached('.io-ox-busy');
    I.say('Size > Descending');
    checkFileOrder(I, ['testdocument.rtf', 'testpresentation.ppsm', 'testdocument.odt', 'document.txt']);
});

Scenario('[C45041] Select files', async (I, drive) => {
    const testFolder = await I.haveFolder({ title: 'Selecttest', module: 'infostore', parent: await I.grabDefaultFolder('infostore') }),
        filePath = 'e2e/media/files/0kb/',
        files = await readdir(filePath);

    await I.haveFolder({ title: 'Subfolder', module: 'infostore', parent: testFolder });

    files.forEach((name) => {
        if (name !== '.DS_Store') I.haveFile(testFolder, filePath + name);
    });
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('Selecttest');

    I.clickToolbar('Select');
    I.click('All');
    I.waitNumberOfVisibleElements('.file-list-view .list-item.selected', 23);

    I.clickToolbar('Select');
    I.click('All files');
    I.waitNumberOfVisibleElements('.file-list-view .list-item.selected', 22);


    I.clickToolbar('Select');
    I.click('None');
    I.dontSeeElementInDOM('.file-list-view .list-item.selected');
});

Scenario('[C45042] Filter files', async (I, drive) => {
    // BUG: This menu should be grouped as it has 2 sets of menuitemradios
    // to make matters worse there are two "All" menuitems without a relation
    // to a group.

    const testFolder = await I.haveFolder({ title: 'Filtertest', module: 'infostore', parent: await I.grabDefaultFolder('infostore') }),
        filePath = 'e2e/media/files/0kb/',
        files = await readdir(filePath);

    files.forEach((name) => {
        if (name !== '.DS_Store') I.haveFile(testFolder, filePath + name);
    });
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.selectFolder('Filtertest');
    I.clickToolbar('Select');
    I.click('PDFs');
    I.waitForText('document.pdf', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 1);
    I.clickToolbar('Select');
    I.click('Text documents');
    I.waitForText('document.doc', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 5);
    I.clickToolbar('Select');
    I.click('Spreadsheets');
    I.waitForText('spreadsheet.xls', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 2);
    I.clickToolbar('Select');
    I.click('Presentations');
    I.waitForText('presentation.ppsm', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 2);
    I.clickToolbar('Select');
    I.click('Images');
    I.waitForText('image.gif', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 3);
    I.clickToolbar('Select');
    I.click('Music');
    I.waitForText('music.mp3', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 5);
    I.clickToolbar('Select');
    I.click('Videos');
    I.waitForText('video.avi', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 4);
    I.clickToolbar('Select');
    // Read comment at the beginning of the scenario to find out why
    // the following selector is so clunky
    I.click({ css: 'a[data-name="filter"][data-value="all"]' });
    I.waitForText('document.doc', 5, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 22);
});
