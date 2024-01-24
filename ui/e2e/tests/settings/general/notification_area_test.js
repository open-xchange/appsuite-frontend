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

const moment = require('moment');

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7763] Configure notification area', async ({ I, users }) => {

    var userA = users[0], userB = users[1];

    // userA invites userB to an appointment
    // appointment needs to be in the future in order to get a notification
    var format = 'YMMDD[T]HHmmss',
        start = moment().startOf('day').add(36, 'hours').format(format),
        end = moment().startOf('day').add(37, 'hours').format(format);
    await I.haveAppointment({
        folder: `cal://0/${await I.grabDefaultFolder('calendar')}`,
        summary: 'Timezone test',
        startDate: { value: start, tzid: 'Europe/Berlin' },
        endDate: { value: end, tzid: 'Europe/Berlin' },
        attendees: [{ entity: userA.userdata.id }, { entity: userB.userdata.id }]
    });

    // userB logs in
    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });
    I.login('app=io.ox/mail', { user: userB });
    I.waitForText('1', 10, '#io-ox-notifications-icon');
    I.dontSeeElement('#io-ox-notifications-icon.open');
    I.logout();

    // userB logs in (again)
    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: true } }, { user: userB });
    I.login('app=io.ox/mail', { user: userB });
    I.waitForText('1', 10, '#io-ox-notifications-icon');
    I.seeElement('#io-ox-notifications-icon.open');
});
