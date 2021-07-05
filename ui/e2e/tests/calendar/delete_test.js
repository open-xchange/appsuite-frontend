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

const moment = require('moment');

Feature('Calendar > Delete');

Before(async ({ I, users }) => {
    await users.create();
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7466] Delete one appointment of an series', async function ({ I, calendar, dialogs }) {
    const testrailID = 'C7466';
    const ariaLabel = `~${testrailID}, ${testrailID}`;

    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        rrule: 'FREQ=WEEKLY;BYDAY=' + moment().format('dd') + '',
        startDate: { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD') }
    });

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.clickToolbar('Today');
    I.click('.next');
    I.waitForElement(ariaLabel, 5);
    I.click(ariaLabel);

    I.say('Delete');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup');
    I.waitForText('Delete', undefined, '.io-ox-sidepopup');
    I.click('Delete', '.io-ox-sidepopup');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete this appointment');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached(ariaLabel);
    I.click('Today');
    I.waitForElement(ariaLabel, 5);
    I.click('.next');
    I.waitForDetached(ariaLabel, 5);
    I.click('.next');
    I.waitForElement(ariaLabel, 5);
    I.click('.next');
    I.waitForElement(ariaLabel, 5);
    I.click('.next');
    I.waitForElement(ariaLabel, 5);
    I.click('.next');
    I.waitForElement(ariaLabel, 5);
});

Scenario('[C7468] Delete an appointment', async function ({ I, calendar }) {
    const testrailID = 'C7468';
    const ariaLabel = `~${testrailID}, ${testrailID}`;
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate:   { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') },
        startDate: { tzid: 'Europe/Berlin', value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00') }
    });
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.clickToolbar('Today');
    I.waitForElement(ariaLabel, 5);
    I.click(ariaLabel);
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);

    calendar.deleteAppointment();
    I.waitForDetached(ariaLabel);
});

Scenario('[C7469] Delete a whole-day appointment', async function ({ I, calendar }) {
    const testrailID = 'C7469';
    const ariaLabel = `~${testrailID}, ${testrailID}`;

    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate:   { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD') },
        startDate: { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD') }
    });
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.clickToolbar('Today');
    I.waitForVisible(ariaLabel);
    I.click(ariaLabel);
    I.waitForVisible('.io-ox-calendar-main .io-ox-sidepopup');

    calendar.deleteAppointment();
    I.waitForDetached(ariaLabel);
});
