/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

const moment = require('moment-range').extendMoment(require('moment'));

Feature('Calendar > Delete');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7466] Delete one appointment of an series', async function (I, users) {
    const testrailID = 'C7466';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        rrule: 'FREQ=WEEKLY;BYDAY=' + moment().format('dd') + '',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().format('YYYYMMDD')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().format('YYYYMMDD')
        },
        attendees: [
            {
                cuType: 'INDIVIDUAL',
                cn: users[0].userdata.given_name + ' ' + users[0].userdata.sur_name,
                partStat: 'ACCEPTED',
                entity: users[0].userdata.id,
                email: users[0].userdata.primaryEmail,
                uri: 'mailto:' + users[0].userdata.primaryEmail,
                contact: {
                    display_name: users[0].userdata.given_name + ' ' + users[0].userdata.sur_name,
                    first_name: users[0].userdata.given_name,
                    last_name: users[0].userdata.sur_name
                }
            }
        ]
    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup');
    I.waitForText('Delete', undefined, '.io-ox-sidepopup');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal');
    I.click('This appointment', '.modal');
    I.waitForDetached('.modal');
    I.waitForDetached('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.click('Today');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.next');
    I.waitForDetached('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
});

Scenario('[C7468] Delete an appointment', async function (I, users) {

    const testrailID = 'C7468';

    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        //rrule: 'FREQ=WEEKLY;BYDAY=' + moment().format('dd') + '',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        attendees: [
            {
                cuType: 'INDIVIDUAL',
                cn: users[0].userdata.given_name + ' ' + users[0].userdata.sur_name,
                partStat: 'ACCEPTED',
                entity: users[0].userdata.id,
                email: users[0].userdata.primaryEmail,
                uri: 'mailto:' + users[0].userdata.primaryEmail,
                contact: {
                    display_name: users[0].userdata.given_name + ' ' + users[0].userdata.sur_name,
                    first_name: users[0].userdata.given_name,
                    last_name: users[0].userdata.sur_name
                }
            }
        ]
    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal');
    I.click('Delete', '.modal');
    I.waitForDetached('.modal');
    I.waitForDetached('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
});

Scenario('[C7469] Delete a whole-day appointment', async function (I, users) {
    let testrailID = 'C7469';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        //rrule: 'FREQ=WEEKLY;BYDAY=' + moment().format('dd') + '',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().format('YYYYMMDD')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().format('YYYYMMDD')
        },
        attendees: [
            {
                cuType: 'INDIVIDUAL',
                cn: users[0].userdata.given_name + ' ' + users[0].userdata.sur_name,
                partStat: 'ACCEPTED',
                entity: users[0].userdata.id,
                email: users[0].userdata.primaryEmail,
                uri: 'mailto:' + users[0].userdata.primaryEmail,
                contact: {
                    display_name: users[0].userdata.given_name + ' ' + users[0].userdata.sur_name,
                    first_name: users[0].userdata.given_name,
                    last_name: users[0].userdata.sur_name
                }
            }
        ]
    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal');
    I.click('Delete', '.modal');
    I.waitForDetached('.modal');
    I.waitForDetached('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
});
