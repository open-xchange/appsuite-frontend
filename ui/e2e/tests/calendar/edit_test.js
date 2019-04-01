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

const moment = require('moment');
const expect = require('chai').expect;

Feature('Calendar > Edit');

Before(async (users) => {
    await users.create();
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7464] Change appointment in shared folder as guest', async function (I, users) {
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(3, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }]
    });

    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForText('Testappointment');

    I.doubleClick('.appointment');
    I.wait(1);
    I.dontSeeElement('.io-ox-calendar-edit-window');

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
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
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
    }, { user: users[0] });
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
    expect(await I.grabTextFrom('.io-ox-sidepopup-pane .date-time')).to.equal(moment().add(1, 'hours').format('ddd') + ', ' + moment().add(1, 'hours').format('M/D/YYYY') + '   12:00 – 1:00 PMCEST');
    I.logout();
});

Scenario('[C7462] Remove a participant', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C7462';
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
    }, { user: users[0] });
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
    I.click('.appointment-container [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForElement('[data-action="io.ox/calendar/detail/actions/edit"]', 5);
    I.waitForDetached('.io-ox-sidepopup-pane a[title="' + users[1].userdata.primaryEmail + '"]');
    I.logout();
});
