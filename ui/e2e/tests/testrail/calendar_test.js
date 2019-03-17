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
const expect = require('chai').expect;

Feature('testrail - calendar');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});
Scenario('[C274484] Attendees can change the appointment', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C274484';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[1] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[1] });
    I.haveSetting('io.ox/calendar//chronos/allowAttendeeEditsByDefault', true, { user: users[1] });
    I.haveSetting('io.ox/calendar//viewView', 'week:week', { user: users[1] });
    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'MODIFY',
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
            }, {
                cuType: 'INDIVIDUAL',
                cn: users[1].userdata.given_name + ' ' + users[1].userdata.sur_name,
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id,
                email: users[1].userdata.primaryEmail,
                uri: 'mailto:' + users[1].userdata.primaryEmail,
                contact: {
                    display_name: users[1].userdata.given_name + ' ' + users[1].userdata.sur_name,
                    first_name: users[1].userdata.given_name,
                    last_name: users[1].userdata.sur_name
                }
            }
        ]
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2019-05-01"))');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/edit"]');
    I.waitForElement('.io-ox-calendar-edit.container');
    I.waitForVisible('.io-ox-calendar-edit.container');
    I.fillField('.io-ox-calendar-edit [name="description"]', timestamp);
    I.click('Save');
    I.logout();
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForText(timestamp, 5, '.io-ox-sidepopup-pane .calendar-detail .note');
});
Scenario('[C274515] Attendees are not allowed to change their own permission status', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C274515';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//chronos/allowAttendeeEditsByDefault', true);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'MODIFY',
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
            }, {
                cuType: 'INDIVIDUAL',
                cn: users[1].userdata.given_name + ' ' + users[1].userdata.sur_name,
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id,
                email: users[1].userdata.primaryEmail,
                uri: 'mailto:' + users[1].userdata.primaryEmail,
                contact: {
                    display_name: users[1].userdata.given_name + ' ' + users[1].userdata.sur_name,
                    first_name: users[1].userdata.given_name,
                    last_name: users[1].userdata.sur_name
                }
            }
        ]
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/edit"]');
    I.waitForElement('.io-ox-calendar-edit.container');
    I.waitForVisible('.io-ox-calendar-edit.container');
    I.waitForElement('.disabled.attendee-change-checkbox', 5);
    I.logout();
});
Scenario('[C274516] Follow up should also propose a future date for appointments in the future', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C274516';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(1, 'week').add(1, 'day').format('YYYYMMDD')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(1, 'week').format('YYYYMMDD')
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
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.next');
    I.waitForVisible('.next');
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/follow-up"]');
    I.waitForElement('[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit', 5);
    I.waitForVisible('[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit', 5);
    let startDate = await I.grabAttributeFrom('[data-attribute="startDate"] .datepicker-day-field', 'value');
    let endDate = await I.grabAttributeFrom('[data-attribute="endDate"] .datepicker-day-field', 'value');
    expect(startDate.toString()).to.equal(moment().add(2, 'week').format('M/D/YYYY'));
    //Bug 
    expect(endDate.toString()).to.equal(moment().add(2, 'week').format('M/D/YYYY'));
    I.click('Create');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    expect(await I.grabTextFrom('.io-ox-sidepopup-pane .date-time')).to.equal(moment().add(2, 'week').format('ddd') + ', ' + moment().add(2, 'week').format('M/D/YYYY') + '   Whole day');
    I.logout();
});
Scenario('[C274425] Month label in Calendar week view', async function (I, users) {
    let testrailID = 'C274425';
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2019-05-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('April - May 2019 CW 18');
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-01-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('December 2019 - January 2020 CW 1');
    I.logout();
});
Scenario('[C7462] Remove a participant', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C7462';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
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
            }, {
                cuType: 'INDIVIDUAL',
                cn: users[1].userdata.given_name + ' ' + users[1].userdata.sur_name,
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id,
                email: users[1].userdata.primaryEmail,
                uri: 'mailto:' + users[1].userdata.primaryEmail,
                contact: {
                    display_name: users[1].userdata.given_name + ' ' + users[1].userdata.sur_name,
                    first_name: users[1].userdata.given_name,
                    last_name: users[1].userdata.sur_name
                }
            }
        ]
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForElement('[data-action="io.ox/calendar/detail/actions/edit"]', 5);
    I.waitForElement('.io-ox-sidepopup-pane a[title="' + users[1].userdata.primaryEmail + '"]');
    I.click('[data-action="io.ox/calendar/detail/actions/edit"]');
    I.waitForElement('.io-ox-calendar-edit.container');
    I.waitForVisible('.io-ox-calendar-edit.container');
    I.waitForElement('//a[contains(text(),"' + users[1].userdata.primaryEmail + '")]/../../a[contains(@class, "remove")]', 5);
    I.click('//a[contains(text(),"' + users[1].userdata.primaryEmail + '")]/../../a[contains(@class, "remove")]');
    I.waitForDetached('//a[contains(text(),"' + users[1].userdata.primaryEmail + '")]/../../a[contains(@class, "remove")]');
    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit.container', 5);
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForElement('[data-action="io.ox/calendar/detail/actions/edit"]', 5);
    I.waitForDetached('.io-ox-sidepopup-pane a[title="' + users[1].userdata.primaryEmail + '"]');
    I.logout();
});
Scenario('[C7454] Edit appointment, all-day to one hour', async function (I, users) {
    const
        Moment = require('moment'),
        MomentRange = require('moment-range'),
        moment = MomentRange.extendMoment(Moment);
    let testrailID = 'C7454';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
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
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/edit"]');
    I.waitForElement('[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit', 5);
    I.waitForVisible('[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit', 5);
    I.click('All day');
    I.click('.floating-window-content [aria-label="Start time"]');
    I.click('.io-ox-calendar-edit [data-attribute="startDate"] .typeahead [data-value="12:00 PM"]');
    I.click('.floating-window-content [aria-label="End time"]');
    I.click('.io-ox-calendar-edit [data-attribute="endDate"] .typeahead [data-value="1:00 PM"]');
    I.click('Save');
    I.waitForDetached('[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    expect(await I.grabTextFrom('.io-ox-sidepopup-pane .date-time')).to.equal(moment().add(1, 'hours').format('ddd') + ', ' + moment().add(1, 'hours').format('M/D/YYYY') + '   12:00 – 1:00 PMCET');
    I.logout();
});
Scenario('[C7466] Delete one appointment of an series', async function (I, users) {
    const
        Moment = require('moment'),
        MomentRange = require('moment-range'),
        moment = MomentRange.extendMoment(Moment);
    let testrailID = 'C7466';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
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
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.click('.next');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/delete"]');
    I.waitForVisible('.delete-dialog');
    I.click('[data-action="appointment"]', '.delete-dialog .modal-footer');
    I.waitForDetached('.delete-dialog');
    I.dontSeeElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
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
    I.logout();
});
Scenario('[C7468] Delete an appointment', async function (I, users) {
    const
        Moment = require('moment'),
        MomentRange = require('moment-range'),
        moment = MomentRange.extendMoment(Moment);
    let testrailID = 'C7468';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
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
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/delete"]');
    I.waitForVisible('.delete-dialog');
    I.click('[data-action="ok"]', '.delete-dialog .modal-footer');
    I.waitForDetached('.delete-dialog');
    I.dontSeeElement('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.logout();
});
Scenario('[C7469] Delete a whole-day appointment', async function (I, users) {
    const
        Moment = require('moment'),
        MomentRange = require('moment-range'),
        moment = MomentRange.extendMoment(Moment);
    let testrailID = 'C7469';
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    const appointmentDefaultFolder = await I.getDefaultFolder('calendar', { user: users[0] });
    const appointment = {
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
    };
    I.haveAppointment({ user: users[0] }, 'cal://0/' + appointmentDefaultFolder, appointment);
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.click('[data-action="io.ox/calendar/detail/actions/delete"]');
    I.waitForVisible('.delete-dialog');
    I.click('[data-action="ok"]', '.delete-dialog .modal-footer');
    I.waitForDetached('.delete-dialog');
    I.dontSeeElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.logout();
});
