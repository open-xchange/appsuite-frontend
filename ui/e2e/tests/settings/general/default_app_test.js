/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7761] Define default app after login', async ({ I }) => {

    // Calendar
    await I.haveSetting({ 'io.ox/core': { autoStart: 'io.ox/calendar/main' } });
    I.login();
    I.waitForText('Scheduling');
    I.waitForText('Today');
    I.logout();

    // Mail
    await I.haveSetting({ 'io.ox/core': { autoStart: 'io.ox/mail/main' } });
    I.login();
    I.waitForText('Compose');
    I.waitForText('No message selected');
    I.logout();

    // None
    await I.haveSetting({ 'io.ox/core': { autoStart: 'none' } });
    I.login();
    I.waitForInvisible('#background-loader');
    I.dontSeeElement('.window-container');
});
