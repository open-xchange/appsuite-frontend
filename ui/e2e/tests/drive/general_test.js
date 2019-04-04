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

Feature('Drive > General');

const prepare = (I, folder) => {
    I.login('app=io.ox/files' + (folder ? '&folder=' + folder : ''));
    I.waitForElement('.file-list-view.complete');
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
Scenario('[C8366] Edit description', async (I) => {
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
