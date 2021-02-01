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

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario.skip('[C273807] Download infected file', async function ({ I }) {
    const folder = await I.grabDefaultFolder('tasks');
    const { id } = await I.haveTask({ folder_id: folder, title: 'My Subject', note: 'My Description' });

    await I.haveAttachment('tasks', { id, folder_id: folder }, { name: 'eicar.exe', content: `${'X5O!P%@AP[4\\PZX54(P^)7CC)7}'}${'$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'}` });

    I.login();
    I.openApp('Tasks');

    I.waitForVisible('.tasks-detailview');
    I.waitForText('eicar.exe');

    I.click('eicar.exe');
    // legacy container. shouldn't this be a 'smart-dropdown-container'?
    I.waitForVisible('.dropdown-menu');

    I.click('Download');
    I.waitForText('Anti-Virus Warning');

    I.see('The file \'eicar.exe\' you are trying to download seems to be infected with \'Eicar-Test-Signature\'.');
    I.click('Cancel');

    I.click('eicar.exe');
    // legacy container. shouldn't this be a 'smart-dropdown-container'?
    I.waitForVisible('.dropdown-menu');

    I.click('Download');
    I.waitForText('Anti-Virus Warning');

    I.see('The file \'eicar.exe\' you are trying to download seems to be infected with \'Eicar-Test-Signature\'.');
    I.click('Download infected file');
});
