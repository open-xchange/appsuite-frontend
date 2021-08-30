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

Scenario('[C7491] Delete an appointment', async ({ I, dialogs }) => {
    // set settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveSetting('io.ox/core//showDesktopNotifications', false);

    // Create appointments

    const moment = require('moment');
    let testrailID = 'C7491';

    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + '-1',
        location: testrailID,
        description: testrailID + '-1',
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(6, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + '-2',
        location: testrailID,
        description: testrailID + '-2',
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(8, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(7, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    // Add Appointments widget to Portal
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Appointments');

    // Delete first appointment
    I.waitForElement('~Appointments');
    I.waitForElement('.widget[aria-label="Appointments"] ul li:nth-child(2)');
    I.see('C7491-1', '.widget[aria-label="Appointments"] ul li:nth-child(1)');
    I.see('C7491-2', '.widget[aria-label="Appointments"] ul li:nth-child(2)');
    I.click('.widget[aria-label="Appointments"] ul li:nth-child(1)');
    I.waitForText('Delete', undefined, '.io-ox-sidepopup');

    I.click('Delete', '.io-ox-sidepopup');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');

    // Verify the popup closes itself and the widget updates its list of appointments
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');
    within('.widgets', () => {
        I.waitNumberOfVisibleElements('.widget', 1, 10);
        I.dontSee('C7491-1');
        I.see('C7491-2');
    });
});
