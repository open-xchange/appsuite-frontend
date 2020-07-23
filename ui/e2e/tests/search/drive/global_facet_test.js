
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Search > Drive');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C8369] Search via facet "global"', async (I, drive, search) => {
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
    search.waitForWidget();

    // filename: full name
    search.doSearch('document.txt');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 1);
    search.cancel();

    // filename: not existing
    search.waitForWidget();
    search.doSearch('noneexisting');
    I.waitForText('No matching items found.');
    search.cancel();

    // filename: start of string
    search.waitForWidget();
    search.doSearch('d');
    I.waitNumberOfVisibleElements('.file-list-view .list-item', 3);
});
