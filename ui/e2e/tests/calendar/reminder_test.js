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

const moment = require('moment');

Feature('Calendar > reminder');


Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});


// skip for now, too shaky when server is slow (we actually wait here for the reminder time since backend doesn't let us create reminders in the past)
Scenario.skip('duplicate reminder test', async function ({ I }) {

    I.haveSetting('io.ox/core//autoOpenNotification', true);

    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'all reminders in the past',
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss')
        },
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss')
        },
        alarms: [{
            action: 'DISPLAY',
            description: '3s before',
            trigger: { duration: '-PT3S', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '2s before',
            trigger: { duration: '-PT2S', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '2s before',
            trigger: { duration: '-PT2S', related: 'START' }
        }]
    });

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'all reminders in the future',
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(1, 'hour').format('YYYYMMDD[T]HHmmss')
        },
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmmss')
        },
        alarms: [{
            action: 'DISPLAY',
            description: '15min before',
            trigger: { duration: '-PT15M', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '15min before',
            trigger: { duration: '-PT15M', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '30min before',
            trigger: { duration: '-PT30M', related: 'START' }
        }]
    });

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'reminders in the future and past',
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss')
        },
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss')
        },
        alarms: [{
            action: 'DISPLAY',
            description: '15min after',
            trigger: { duration: 'PT15M', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '15min after',
            trigger: { duration: 'PT15M', related: 'START' }
        },
        {
            action: 'DISPLAY',
            description: '2s before',
            trigger: { duration: '-PT2S', related: 'START' }
        }]
    });

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'Appointment3',
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss')
        },
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss')
        },
        alarms: [{
            action: 'DISPLAY',
            description: '15min after start',
            trigger: { duration: 'PT15M', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '1s after end',
            trigger: { duration: 'PT1S', related: 'END' }
        },
        {
            action: 'DISPLAY',
            description: '2s before start',
            trigger: { duration: '-PT2S', related: 'START' }
        }]
    });

    // ugly but needed, we need to wait, so the reminders are ready to trigger (backend disallows directly creating reminders in the past atm. Remove when backend offers parameter)
    I.wait(15);

    I.login('app=io.ox/calendar');

    // wait longer here, notification area has a built in delay (to improve rampup time of the rest of appsuite)
    I.waitForVisible({ css: '#io-ox-notifications-display .reminder-item' }, 15);
    I.waitForText('all reminders in the past', 5, { css: '#io-ox-notifications-display' });
    I.waitForText('reminders in the future and past', 5, { css: '#io-ox-notifications-display' });
    I.waitForText('Appointment3', 5, { css: '#io-ox-notifications-display' });
    I.seeNumberOfElements('.reminder-item', 3);
});

// skip for now, too shaky when server is slow (we actually wait here for the reminder time since backend doesn't let us create reminders in the past)
Scenario.skip('reminders for past appointments', async function ({ I }) {

    I.haveSetting('io.ox/core//autoOpenNotification', true);
    I.haveSetting('io.ox/calendar//showPastReminders', false);

    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'all reminders in the past',
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss')
        },
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss')
        },
        alarms: [{
            action: 'DISPLAY',
            description: '3s before',
            trigger: { duration: '-PT3S', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '2s before',
            trigger: { duration: '-PT2S', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '2s before',
            trigger: { duration: '-PT2S', related: 'START' }
        }]
    });

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'reminders in the future and past',
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss')
        },
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss')
        },

        alarms: [{
            action: 'DISPLAY',
            description: '15min after start',
            trigger: { duration: 'PT15M', related: 'START' }
        }, {
            action: 'DISPLAY',
            description: '1s after end',
            trigger: { duration: 'PT1S', related: 'END' }
        },
        {
            action: 'DISPLAY',
            description: '2s before start',
            trigger: { duration: '-PT2S', related: 'START' }
        }]
    });

    // ugly but needed, we need to wait, so the reminders are ready to trigger (backend disallows directly creating reminders in the past atm. Remove when backend offers parameter)
    I.wait(15);

    I.login('app=io.ox/calendar');

    // wait longer here, notification area has a built in delay (to improve rampup time of the rest of appsuite)
    I.waitForVisible({ css: '#io-ox-notifications-display .reminder-item' }, 15);
    I.dontSee('all reminders in the past', { css: '#io-ox-notifications-display' });
    I.waitForText('reminders in the future and past', 5, { css: '#io-ox-notifications-display' });
    I.seeNumberOfElements('.reminder-item', 1);

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
    I.waitForText('Show reminders for past appointments');
    I.click('Show reminders for past appointments');

    I.waitForVisible({ css: '#io-ox-notifications-display .reminder-item' }, 15);
    I.see('all reminders in the past', { css: '#io-ox-notifications-display' });
    I.waitForText('reminders in the future and past', 5, { css: '#io-ox-notifications-display' });
    I.seeNumberOfElements('.reminder-item', 2);
});
