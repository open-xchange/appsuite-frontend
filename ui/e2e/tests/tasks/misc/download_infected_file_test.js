/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Tasks');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario.skip('[C273807] Download infected file', function (I) {

    // 1. Login

    I.login();

    // 2. Go to Tasks

    I.openApp('Tasks');

    // 3. Create a taks with the attached virus file (eicar.txt)

    I.clickToolbar('New');
    I.waitForVisible('[data-app-name="io.ox/tasks/edit"]');

    I.fillField('Subject', 'My Subject');
    I.fillField('Description', 'My Description');

    I.attachFile('[data-app-name="io.ox/tasks/edit"] input[type="file"]', 'e2e/media/files/eicar.exe');

    I.click('Create');
    I.waitForVisible('.tasks-detailview');
    I.waitForText('eicar.exe');

    // 4. Download the attachment

    I.click('eicar.exe');
    I.waitForVisible('.dropdown-menu'); // legacy container. shouldn't this be a 'smart-dropdown-container'?

    I.click('Download');
    I.waitForText('Anti-Virus Warning');

    I.see('The file \'eicar.exe\' you are trying to download seems to be infected with \'Eicar-Test-Signature\'.');

    // 5. Hit 'Cancel'

    I.click('Cancel');

    // 6. Download the attachment again

    I.click('eicar.exe');
    I.waitForVisible('.dropdown-menu'); // legacy container. shouldn't this be a 'smart-dropdown-container'?

    I.click('Download');
    I.waitForText('Anti-Virus Warning');

    I.see('The file \'eicar.exe\' you are trying to download seems to be infected with \'Eicar-Test-Signature\'.');

    // 7. Hit 'Download infected file'

    I.click('Download infected file');

    // 8. Download and verify the file

    // It's not possible to verify the file on the filesystem.
});
