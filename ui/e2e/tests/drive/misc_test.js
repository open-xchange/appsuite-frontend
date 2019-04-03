/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Drive > Misc');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C114352] Create folder in copy/move dialog', async (I, users) => {

    // Preconditions: At least one file in Drive

    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });

    I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');

    // 1. Go to Drive

    I.login('app=io.ox/files');

    // 2. Select any file

    I.click('.list-item[aria-label*="testdocument.odt"]');
    I.waitForVisible('~Details');

    // 3. Open context menu and select "Move"

    I.click('[data-original-title="More actions"]');
    I.waitForVisible('.smart-dropdown-container');

    I.click('Move');
    I.waitForText('Move');

    // 4. Select "My files" and click "Create folder"

    // "My files" is already selected by default.
    I.click('Create folder');
    I.waitForText('Add new folder');

    // 5. Choose a name and hit "Add"

    I.fillField('[data-point="io.ox/core/folder/add-popup"] input', 'Foobar');
    I.click('Add');
    I.waitForText('Move');
    I.see('Foobar');

    // 6. Select the new folder and "Move"

    // Folder is already selected by default.
    I.click('Move', '[data-point="io.ox/core/folder/picker"]');
    I.doubleClick('.list-item[aria-label*="Foobar"]');
    I.wait(1);
    I.see('testdocument.odt');

});
