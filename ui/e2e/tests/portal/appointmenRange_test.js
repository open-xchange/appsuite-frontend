/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7490] Appointment range', async ({ I, users }) => {

    // set settings
    I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);

    // Create appointments

    const moment = require('moment');
    let testrailID = 'C7490';

    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + ' + 2 hours',
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(6, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });

    //Appointment in 2 weeks
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + ' + 2 weeks',
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(340, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(338, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });

    //Appointment in 3 weeks and 5 days
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + ' + 3 weeks, 5 days',
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(628, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(626, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });

    //Appointment in 31 days
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + ' + 31 days',
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(748, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(746, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });

    //Add Appointments widget to Portal
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Appointments');

    //Verify appointments displays within one month range
    I.waitForElement('~Appointments');
    I.waitForElement('.widget[aria-label="Appointments"] ul li', 5);
    I.waitForElement('.widget[aria-label="Appointments"] ul li:nth-child(3)', 5);
    I.see('C7490 + 2 hours', '.widget[aria-label="Appointments"] ul li:nth-child(1)');
    I.see('C7490 + 2 weeks', '.widget[aria-label="Appointments"] ul li:nth-child(2)');
    I.see('C7490 + 3 weeks, 5 days', '.widget[aria-label="Appointments"] ul li:nth-child(3)');
    I.dontSeeElement('.widget[aria-label="Appointments"] ul li:nth-child(4)');
});
