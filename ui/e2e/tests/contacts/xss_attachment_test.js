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

/// <reference path="../../steps.d.ts" />

Feature('Contacts');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('adds an malicious attachment to a contact', async function ({ I, contacts }) {
    const folder = await I.grabDefaultFolder('contacts');
    const { id } = await I.haveContact({ folder_id: folder, first_name: 'Evil', last_name: 'Knivel' });
    await I.haveAttachment(
        'contacts',
        { id, folder },
        { name: 'e2e/media/files/><img src=x onerror=alert(123)>', content: '<img src=x onerror=alert(123)>' }
    );

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact('Knivel, Evil');
    I.waitForVisible({ css: 'section[data-block="attachments"]' });
    I.see('><img src=x onerror=alert(123)>');
});
