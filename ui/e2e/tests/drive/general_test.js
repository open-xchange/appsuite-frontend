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

const prepare = (I, folder) => {
    I.login('app=io.ox/files' + (folder ? '&folder=' + folder : ''));
    I.waitForVisible('.file-list-view.complete');
};

Before(async (I, users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C8362] Add note', (I) => {
    prepare(I);
    I.clickToolbar('New');
    I.click('Add note');
    I.waitForElement('input[type="text"].title');
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
Scenario.skip('[C8364] Upload new file', (I) => {
    prepare(I);
    I.clickToolbar('New');
    I.waitForText('Upload files');
    I.click('Upload files');
    I.attachFile('.dropdown.open input[name=file]', 'e2e/media/files/0kb/document.txt');
    // TODO: Continue when Bug is fixed
});

// Note: This is not accessible H4 and textarea does not have a label
Scenario('[C8366] Edit description @shaky', async (I) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    prepare(I);
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
    I.seeTextEquals('Test description changed', 'div.description');
});

const checkIfFoldersExist = (I, layout) => {
    I.see('Documents', layout);
    I.see('Music', layout);
    I.see('Pictures', layout);
    I.see('Videos', layout);
};

Scenario('[C8368] View change', async (I) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    prepare(I);
    checkIfFoldersExist(I);
    I.see('document.txt');

    I.clickToolbar('View');
    I.click('Icons');
    I.waitForElement('.file-list-view.complete.grid-layout');
    checkIfFoldersExist(I, '.grid-layout');
    I.see('document');

    I.clickToolbar('View');
    I.click('Tiles');
    I.waitForElement('.file-list-view.complete.tile-layout');
    checkIfFoldersExist(I, '.tile-layout');

    I.clickToolbar('View');
    I.click('List');
    I.waitForElement('.file-list-view.complete');
    checkIfFoldersExist(I);
    I.see('document.txt');
});

const searchFor = (I, query) => {
    I.click('.search-field');
    I.waitForElement('.token-input');
    I.fillField('.token-input', query);
    I.pressKey('Enter');
};

Scenario('[C8369] Search', async (I, users) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    const testFolder = await I.haveFolder('Testfolder', 'infostore', folder, { user: users[0] });
    await I.haveFile(testFolder.data, 'e2e/media/files/0kb/document.txt');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testdocument.rtf');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testdocument.odt');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testpresentation.ppsm');
    prepare(I);
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

Scenario('[C8371] Delete file', async (I) => {
    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'e2e/media/files/0kb/document.txt');
    prepare(I);
    I.waitForText('document.txt', 1, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.clickToolbar('~Delete');
    I.waitForText('Do you really want to delete this item?');
    I.click('Delete');
    I.selectFolder('Trash');
    I.waitForText('document.txt', 1, '.file-list-view');
    I.click(locate('li.list-item').withText('document.txt'));
    I.clickToolbar('~Delete forever');
    I.waitForText('Do you really want to delete this item?');
    I.click('Delete');
    I.waitForDetached(locate('li.list-item').withText('document.txt'));
});

Scenario.skip('[C8372] Upload a 0KB file', () => {
    // Bug: see C8364
    // TODO: Evaluate if this is needed, see C8364
    // Also drag and drop testing is quite complicated and not sure if at all possible atm
});

Scenario('[C45039] Breadcrumb navigation', async (I, users) => {
    const folder = await I.haveFolder('Folders', 'infostore', await I.grabDefaultFolder('infostore'), { user: users[0] });
    await I.haveFolder('subfolder_1', 'infostore', folder.data, { user: users[0] });
    await I.haveFolder('subfolder_2', 'infostore', folder.data, { user: users[0] });
    const subFolder = await I.haveFolder('subfolder_3', 'infostore', folder.data, { user: users[0] });
    const subsubFolder = await I.haveFolder('subsubfolder_1', 'infostore', subFolder.data, { user: users[0] });
    await I.haveFolder('subsubfolder_2', 'infostore', subFolder.data, { user: users[0] });
    prepare(I, subsubFolder.data);
    I.retry(5).click('subfolder_3', '.breadcrumb-view');
    I.waitForText('subsubfolder_1', 1, '.list-view');
    I.waitForText('subsubfolder_2', 1, '.list-view');
    I.click('Drive', '.breadcrumb-view');
    I.waitForText('Drive', 1, '.breadcrumb-view');
    I.waitForText('Public files', 1, '.list-view');
    I.doubleClick('Public files', '.list-view');
});

const checkFileOrder = (I, files) => {
    files.forEach((name, index) => { I.see(name, '.list-item:nth-child(' + (index + 2) + ')'); });
};

Scenario('[C45040] Sort files', async (I, users) => {
    const folder = await I.grabDefaultFolder('infostore');
    const testFolder = await I.haveFolder('Testfolder', 'infostore', folder, { user: users[0] });
    await I.haveFile(testFolder.data, 'e2e/media/files/0kb/document.txt');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testdocument.rtf');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testdocument.odt');
    await I.haveFile(testFolder.data, 'e2e/media/files/generic/testpresentation.ppsm');
    prepare(I);
    I.selectFolder('Testfolder');
    // Begins with Name ascending order
    checkFileOrder(I, ['document.txt', 'testdocument.odt', 'testdocument.rtf', 'testpresentation.ppsm']);
    I.clickToolbar('Sort by');
    I.click('Descending');
    checkFileOrder(I, ['testpresentation.ppsm', 'testdocument.rtf', 'testdocument.odt', 'document.txt']);

    I.clickToolbar('Sort by');
    I.click('Date');
    checkFileOrder(I, ['testpresentation.ppsm', 'testdocument.odt', 'testdocument.rtf', 'document.txt']);
    I.clickToolbar('Sort by');
    I.click('Ascending');
    checkFileOrder(I, ['document.txt', 'testdocument.rtf', 'testdocument.odt', 'testpresentation.ppsm']);

    I.clickToolbar('Sort by');
    I.click('Size');
    checkFileOrder(I, ['document.txt', 'testdocument.odt', 'testpresentation.ppsm', 'testdocument.rtf']);
    I.clickToolbar('Sort by');
    I.click('Descending');
    checkFileOrder(I, ['testdocument.rtf', 'testpresentation.ppsm', 'testdocument.odt', 'document.txt']);
});

Scenario('[C45041] Select files', async (I, users) => {
    const testFolder = await I.haveFolder('Selecttest', 'infostore', await I.grabDefaultFolder('infostore'), { user: users[0] }),
        filePath = 'e2e/media/files/0kb/',
        files = await readdir(filePath);

    await I.haveFolder('Subfolder', 'infostore', testFolder.data);

    files.forEach((name) => {
        if (name !== '.DS_Store') I.haveFile(testFolder.data, filePath + name);
    });
    prepare(I);
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

Scenario('[C45042] Filter files @shaky', async (I, users) => {
    // BUG: This menu should be grouped as it has 2 sets of menuitemradios
    // to make matters worse there are two "All" menuitems without a relation
    // to a group.

    const testFolder = await I.haveFolder('Filtertest', 'infostore', await I.grabDefaultFolder('infostore'), { user: users[0] }),
        filePath = 'e2e/media/files/0kb/',
        files = await readdir(filePath);

    files.forEach((name) => {
        if (name !== '.DS_Store') I.haveFile(testFolder.data, filePath + name);
    });
    prepare(I);
    I.selectFolder('Filtertest');
    I.clickToolbar('Select');
    I.click('PDFs');
    I.waitForText('document.pdf', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 1);
    I.clickToolbar('Select');
    I.click('Text documents');
    I.waitForText('document.doc', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 5);
    I.clickToolbar('Select');
    I.click('Spreadsheets');
    I.waitForText('spreadsheet.xls', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 2);
    I.clickToolbar('Select');
    I.click('Presentations');
    I.waitForText('presentation.ppsm', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 2);
    I.clickToolbar('Select');
    I.click('Images');
    I.waitForText('image.gif', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 3);
    I.clickToolbar('Select');
    I.click('Music');
    I.waitForText('music.mp3', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 5);
    I.clickToolbar('Select');
    I.click('Videos');
    I.waitForText('video.avi', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 4);
    I.clickToolbar('Select');
    // Read comment at the beginning of the scenario to find out why
    // the following selector is so clunky
    I.click('a[data-name="filter"][data-value="all"]');
    I.waitForText('document.doc', 1, '.file-list-view');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 22);
});
