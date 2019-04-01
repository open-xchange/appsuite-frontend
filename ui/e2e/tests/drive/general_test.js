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
