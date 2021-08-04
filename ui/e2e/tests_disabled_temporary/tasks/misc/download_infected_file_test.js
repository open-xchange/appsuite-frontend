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
