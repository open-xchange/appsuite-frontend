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

Feature('Contacts > Distribution List > Delete');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

const util = require('./util');

Scenario('[C7379] Single distribution list', async function ({ I, contacts, dialogs }) {
    const display_name = util.uniqueName('C7379'),
        listElement = { css: '[aria-label="' + display_name + '"]' };
    await I.haveContact({ display_name: display_name, folder_id: await I.grabDefaultFolder('contacts'), mark_as_distributionlist: true });

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForElement(listElement);
    I.click(listElement);
    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.dontSee(listElement);
});

Scenario('[C7378] Multiple distribution lists', async function ({ I, search, contacts, dialogs }) {
    const display_name = util.uniqueName('C7378'),
        defaultFolder = await I.grabDefaultFolder('contacts'),
        distributionLists = [];
    for (let i = 1; i <= 2; i++) distributionLists.push(I.haveContact({ display_name: display_name + ' - ' + i, folder_id: defaultFolder, mark_as_distributionlist: true }));
    await Promise.all(distributionLists);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    search.doSearch(display_name);
    I.waitForText(display_name, '.vgrid-cell');

    I.click('.select-all');
    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.waitForText('No matching items found.');
    for (let i = 1; i <= 2; i++) I.dontSee(`${display_name} - ${i}`);
});
