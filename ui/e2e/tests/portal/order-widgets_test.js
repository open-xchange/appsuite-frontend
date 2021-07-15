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

Feature('Portal > Functions');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7493] Order widgets', async function ({ I, portal }) {

    I.login('app=io.ox/portal');
    portal.waitForApp();

    // check position before
    I.waitForText('Inbox', '.widgets .widget:nth-child(1) h2');
    I.see('Appointments', '.widgets .widget:nth-child(2) h2');

    // second widget before first widget
    I.dragAndDrop('.widgets .widget:nth-child(2) h2', '.widgets .widget:nth-child(1) h2');

    // check position after
    I.waitForText('Appointments', 5, '.widgets .widget:nth-child(1) h2');
    I.see('Inbox', '.widgets .widget:nth-child(2) h2');
});

Scenario('[C7473] Drag some portal-tiles', async function ({ I, portal }) {

    I.login('app=io.ox/portal');
    portal.waitForApp();

    // check position before
    I.waitForText('Inbox', '.widgets .widget:nth-child(1) h2');
    I.see('Appointments', '.widgets .widget:nth-child(2) h2');
    I.see('My tasks', '.widgets .widget:nth-child(3) h2');
    I.see('Birthdays', '.widgets .widget:nth-child(4) h2');
    I.see('My latest files', '.widgets .widget:last-child h2');

    // move first widget to last position
    I.dragAndDrop('.widgets .widget:nth-child(1) h2', '.widgets .widget:last-child h2');

    // check position after, expected: moved widget last, rest shifted left by one
    I.waitForText('Appointments', 5, '.widgets .widget:nth-child(1) h2');
    I.see('My tasks', '.widgets .widget:nth-child(2) h2');
    I.see('Birthdays', '.widgets .widget:nth-child(3) h2');
    I.see('My latest files', '.widgets .widget:nth-child(4) h2');
    I.see('Inbox', '.widgets .widget:last-child h2');

});
