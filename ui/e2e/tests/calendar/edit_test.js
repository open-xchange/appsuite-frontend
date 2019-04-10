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

// TODO Skip this as the double click does not work. See Bug 64313
Scenario.skip('[C7465] Edit appointment in shared folder as author', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const folder = await I.haveFolder('New calendar', 'event', defaultFolderId);
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder.data,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar');

    I.waitForText('New calendar');
    I.rightClick('~New calendar');
    I.waitForText('Permissions / Invite people');
    I.wait(0.2); // Just wait a little extra for all event listeners
    I.click('Permissions / Invite people');
    I.waitForText('Permissions for folder "New calendar"');
    I.pressKey(users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForDetached('.share-permissions-dialog');

    I.logout();

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[1] });
    I.login('app=io.ox/calendar', { user: users[1] });

    // switch on New calendar
    I.doubleClick('~Shared calendars');
    I.click(`[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar"] .color-label`);
    I.click('~Next Week', '.page.current');

    I.waitForText('Testappointment');

    // 1. Double click to the appointment
    I.doubleClick('.appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 2. Change Subject, Location and Description.
    I.fillField('Subject', 'Changedappointment');
    I.fillField('Location', 'Changedlocation');
    I.fillField('Description', 'Changeddescription');

    // 3. Click "Save"
    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');

    // 4. Check this appointment in all views.
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible(locate('.appointment').inside('.page.current'));
        I.click('.appointment', '.page.current');
        I.see('Changedappointment');
        I.see('Changedlocation');
        I.see('Changeddescription');
    });

    I.logout();
});

Scenario('[C234659] Split appointment series', async function (I, users) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    I.login('app=io.ox/calendar');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Testsubject');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().startOf('week').add(1, 'day').format('l'));
    I.pressKey('Enter');

    I.click('~Start time');
    I.click('4:00 PM');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForText('Testsubject');
    I.seeNumberOfElements('.appointment', 5);

    // click on the second .appointment
    I.click('(//div[@class="appointment-content"])[2]');
    I.waitForVisible('.io-ox-sidepopup');

    I.click('Edit');
    I.waitForText('Do you want to edit this and all future appointments or just this appointment within the series?');
    I.click('All future appointments');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('input.add-participant.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');

    // save
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.dontSee(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    I.click('(//div[@class="appointment-content"])[2]');
    I.waitForVisible('.io-ox-sidepopup');
    I.see(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, '.io-ox-sidepopup');
});

Scenario('[C234679] Exceptions changes on series modification', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    I.login('app=io.ox/calendar');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Testsubject');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().startOf('week').add(1, 'day').format('l'));
    I.pressKey('Enter');

    I.click('~Start time');
    I.click('4:00 PM');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');

    I.click('Apply', '.modal-dialog');
    I.waitForDetached('.modal-dialog');

    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // assert existance
    I.waitForText('Testsubject');
    I.seeNumberOfElements('.appointment', 5);

    // click on the second .appointment and edit it
    I.click('(//div[@class="appointment-content"])[2]');
    I.waitForVisible('.io-ox-sidepopup');

    I.click('Edit');
    I.waitForText('Do you want to edit this and all future appointments or just this appointment within the series?');
    I.click('This appointment');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('~Start time');
    I.click('5:00 PM');

    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // click on the first .appointment and edit it
    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');

    I.click('Edit');
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Series');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Changedsubject');

    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.see('Changedsubject', '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    I.click('(//div[@class="appointment-content"])[2]');
    I.waitForVisible('.io-ox-sidepopup');
    I.see('Changedsubject', '.io-ox-sidepopup');

});

Scenario('[C7467] Delete recurring appointment in shared folder as author', async function (I, users) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const folder = await I.haveFolder('New calendar', 'event', defaultFolderId);
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder.data,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        rrule: 'FREQ=DAILY;COUNT=5'
    });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar');

    I.waitForText('New calendar');
    I.rightClick('~New calendar');
    I.waitForText('Permissions / Invite people');
    I.wait(0.2); // Just wait a little extra for all event listeners
    I.click('Permissions / Invite people');
    I.waitForText('Permissions for folder "New calendar"');
    I.pressKey(users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForDetached('.share-permissions-dialog');

    I.logout();

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[1] });
    I.login('app=io.ox/calendar', { user: users[1] });

    // switch on New calendar
    I.doubleClick('~Shared calendars');
    I.click(`[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar"] .color-label`);

    I.waitForText('Testappointment');

    // delete appointment
    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');

    I.click('Delete');

    I.waitForText('Do you want to delete the whole series or just this appointment within the series?');
    I.click('Series');

    I.waitForDetached('.io-ox-sidepopup');

    I.waitForInvisible('.appointment');

    I.logout();

});

Scenario('[C7470] Delete a recurring appointment', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const folder = await I.haveFolder('New calendar', 'event', defaultFolderId);
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder.data,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        rrule: 'FREQ=DAILY'
    });

    I.login('app=io.ox/calendar');
    I.waitForText('Testappointment');
    I.wait(0.2); // gentle wait for event listeners

    // open all views and load the appointments there
    ['Week', 'Day', 'Month', 'List', 'Workweek'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible(locate('.appointment').inside('.page.current'));
    });

    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup');

    I.retry(5).click('Delete');

    I.waitForText('Do you want to delete the whole series or just this appointment within the series?');
    I.click('Series');

    I.waitForDetached('.io-ox-sidepopup');

    I.waitForInvisible(locate('.appointment').inside('.page.current'));
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.dontSee('.appointment', '.page.current');
    });

    I.logout();

});

Scenario('[C274402] Change organizer of appointment with internal attendees', async function (I, users) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, 'chronos/allowChangeOfOrganizer': true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(3, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testsubject',
        location: 'Testlocation',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }]
    });
    I.login('app=io.ox/calendar');

    I.waitForText('Testsubject');
    I.click('.appointment');

    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.see(`Organizer ${users[0].userdata.display_name}`, '.io-ox-sidepopup');

    I.wait(0.2); // gently wait for event listeners
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Change organizer');

    I.waitForVisible('.modal-dialog');
    I.fillField('Select new organizer', users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');

    I.fillField('Add a message to the notification email for the other participants.', 'Testcomment');
    I.click('Ok');
    I.waitForDetached('.modal-dialog');

    I.waitForDetached('.io-ox-sidepopup');
    I.click('.appointment');

    I.waitForVisible('.io-ox-sidepopup');
    I.click('Details');
    I.waitForText(`Organizer ${users[1].userdata.display_name}`, '.io-ox-sidepopup');
});

Scenario('[274409] Change organizer of series with internal attendees', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, 'chronos/allowChangeOfOrganizer': true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testsubject',
        location: 'Testlocation',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }],
        rrule: 'FREQ=DAILY;COUNT=5'
    });
    I.login('app=io.ox/calendar');

    I.waitForText('Testsubject');
    I.click('(//div[@class="appointment-content"])[2]');
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.see(`Organizer ${users[0].userdata.display_name}`, '.io-ox-sidepopup');

    I.wait(0.2); // gently wait for event listeners
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Change organizer');

    I.waitForText('Do you want to edit this and all future appointments or the whole series?');
    I.click('All future appointments');

    I.waitForVisible('.modal-dialog');
    I.fillField('Select new organizer', users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');

    I.fillField('Add a message to the notification email for the other participants.', 'Testcomment');
    I.click('Ok');
    I.waitForDetached('.modal-dialog');

    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');

    I.click('(//div[@class="appointment-content"])[2]');
    I.waitForVisible('.io-ox-sidepopup');
    I.click('Details');
    I.waitForText(`Organizer ${users[1].userdata.display_name}`, '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.waitForText(`Organizer ${users[0].userdata.display_name}`, '.io-ox-sidepopup');
});

Scenario('[C265149] As event organizer I can add a textual reason why an event was canceled', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    // single appointment without additional participants
    await I.haveAppointment({
        folder:  folder,
        summary: 'Appointment1',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });
    // recurring appointment without additional participants
    await I.haveAppointment({
        folder:  folder,
        summary: 'Appointment2',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        rrule: 'FREQ=DAILY;COUNT=5'
    });
    // single appointment with additional participants
    await I.haveAppointment({
        folder:  folder,
        summary: 'Appointment3',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }]
    });
    // recurring appointment with additional participants
    await I.haveAppointment({
        folder:  folder,
        summary: 'Appointment4',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }],
        rrule: 'FREQ=DAILY;COUNT=5'
    });

    I.login('app=io.ox/calendar');

    // Delete single appointment without additional participants => no comment field
    I.click(locate('.appointment').withText('Appointment1'));
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Do you want to delete this appointment');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete recurring appointment without additional participants => no comment field
    I.click(locate('.appointment').withText('Appointment2'));
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Do you want to delete the whole series or just this appointment within the series?');
    I.click('Series', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete single appointment with additional participants => comment field
    I.click(locate('.appointment').withText('Appointment3'));
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Delete appointment');
    I.see('Add a message to the notification email for the other participants.');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete recurring appointment with additional participants => comment field
    I.click(locate('.appointment').withText('Appointment4'));
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Delete appointment');
    I.see('Add a message to the notification email for the other participants.');
    I.click('Series', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-sidepopup');

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

Scenario('[C7461] Add a participant/ressource', async function (I, users) {
    await users.create();
    await users.create();
    const [userA, userB, weebl, bob] = users;

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true }
    });

    const timestamp = Math.round(+new Date() / 1000);
    const resourceName = `C7461 ${timestamp}`,
        resourceMail = `C7461@${timestamp}.de`;
    await I.dontHaveResource(resourceName);
    await I.haveResource({ description: 'Evil sharks equipped with lazers', display_name: resourceName, name: resourceName, mailaddress: resourceMail });

    const groupName = `C7461 ${timestamp} Group`;
    await I.dontHaveGroup(groupName);
    await I.haveGroup({ name: groupName, display_name: groupName, members: [weebl.userdata.id, bob.userdata.id] });

    // Precondition: A simple appointment already exists
    const folder = `cal://0/${await I.grabDefaultFolder('calendar', { user: userA })}`,
        startTime = moment().add(1, 'hour'),
        endTime = moment().add(2, 'hour'),
        subject = `${userA.userdata.name}s awesome appointment`;
    await I.haveAppointment({
        folder:  folder,
        summary: subject,
        startDate: { value: startTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: endTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    }, { user: userA });

    // 1. Switch to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });

    // Expected Result: The calendar app is shown, including the existing appointment
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.see(subject, '.appointment');

    // 2. Select the appointment and click "Edit"
    I.click(subject, '.appointment');
    I.waitForElement('.io-ox-sidepopup');
    I.waitForText('Edit', 5, '.io-ox-sidepopup');
    I.click('Edit');

    // Expected Result: The edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 3. Locate the "Participants" section and add some OX users, groups and resources as participants. This may include external mail accounts which are not handled by OX
    const addParticipant = (name) => {
        I.fillField('Add contact/resource', name);
        I.wait(0.5);
        I.pressKey('Enter');
    };
    [userB.userdata.primaryEmail, groupName, resourceName, 'foo@bar'].forEach(addParticipant);

    // Expected Result: The participants area is populating with people that got added to the appointment.
    [
        userA.userdata.primaryEmail,
        userB.userdata.primaryEmail,
        weebl.userdata.primaryEmail,
        bob.userdata.primaryEmail,
        'foo@bar'
    ].forEach(mail => I.see(mail, '.participant-wrapper'));

    // 4. Save the appointment and check it in all calendar views
    const getSectionLocator = (sectionName) => locate('fieldset').withDescendant(locate('h2').withText(sectionName));
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // Expected Result: The appointment has been modified and all resources, groups, participants are displayed at the appointment popup.
    // Their confirmation status is indicated as well and they're ordered by their type (internal, external, resource).
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForText(subject, 5, '.page.current .appointment');
        I.click(subject, '.page.current .appointment');
        if (view === 'List') {
            I.waitForElement('.calendar-detail-pane');
            I.see(subject, '.calendar-detail-pane');
        } else {
            I.waitForElement('.io-ox-sidepopup');
            I.see(subject, '.io-ox-sidepopup');
        }
        I.seeElement('a[aria-label="unconfirmed 4"]');
        I.seeElement('a[aria-label="accepted 1"]');
        [
            `${userA.userdata.sur_name}, ${userA.userdata.given_name}`,
            `${userB.userdata.sur_name}, ${userB.userdata.given_name}`,
            `${weebl.userdata.sur_name}, ${weebl.userdata.given_name}`,
            `${bob.userdata.sur_name}, ${bob.userdata.given_name}`
        ].forEach(name => I.see(name, getSectionLocator('Participants')));
        I.seeElement(locate(`a.accepted[title="${userA.userdata.primaryEmail}"]`).inside(getSectionLocator('Participants')));
        I.see('foo', getSectionLocator('External participants'));
        I.see(resourceName, getSectionLocator('Resources'));
    });

    // 5. Check the mail inbox of one of the participants.
    I.logout();
    I.login(['app=io.ox/mail'], { user: userB });

    // Expected Result: A mail has been received, informing about the new appointment.
    let mailCount = await I.grabNumberOfVisibleElements('.list-item');
    let retries = 10;

    while (mailCount < 1) {
        if (retries > 0) {
            I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
            I.click('#io-ox-refresh-icon', '.taskbar');
            I.waitForElement('.launcher .fa-spin-paused', 5);
            I.wait(60);
            console.log('No mail(s) found. Waiting 1 minute ...');
            mailCount = await I.grabNumberOfVisibleElements('.list-item');
            retries--;
        } else {
            console.log('Timeout exceeded. No mails found.');
            break;
        }
    }

    I.click('#io-ox-refresh-icon');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.retry().waitForElement(`span[title="New appointment: ${subject}"]`);

    // clean up groups and resources
    await I.dontHaveResource(resourceName);
    await I.dontHaveGroup(groupName);
});

Scenario('[C7455] Edit appointment by changing the timeframe', async function (I, users) {

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'Dinner for one',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('day').add(13, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('day').add(12, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    I.login('app=io.ox/calendar&perspective=week:day');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.waitForVisible('.appointment');
    I.dragAndDrop('.appointment .resizable-n', '.day .timeslot:nth-child(23)');

    I.see('11:00 AM – 1:00 PMCEST');
    I.dragAndDrop('.appointment .resizable-s', '.day .timeslot:nth-child(28)');

    I.see('11:00 AM – 2:00 PMCEST');

    I.clickToolbar('View');
    I.click('Week', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.see('11:00 AM – 2:00 PMCEST');

    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.see('11:00 AM – 2:00 PMCEST');

    I.clickToolbar('View');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);

    I.see('11:00 AM');
    I.see('2:00 PM');
});

Scenario('[C7460] Add attachments', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true }
    });

    // Precondition: An appointment already exists
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`,
        startTime = moment().add(1, 'hour'),
        endTime = moment().add(2, 'hour'),
        subject = `Tiny Tinas ${startTime.format('h a')}s Tea Party`;
    await I.haveAppointment({
        folder:  folder,
        summary: subject,
        startDate: { value: startTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: endTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    // 1. Switch to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week']);

    // Expected Result: The calendar app is shown with the existing appointment
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.see(subject, '.appointment');

    // 2. Select the existing appointment, click "Edit"
    I.click(subject, '.appointment');
    I.waitForElement('.io-ox-sidepopup');
    I.click('Edit');

    // Expected Result: The appointment edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 3. Locate the "Attachments" area and add files as attachments either by the browsers upload dialog or drag&drop from the file manager or desktop
    I.attachFile('.io-ox-calendar-edit-window input[type="file"]', 'e2e/media/files/generic/testdocument.odt');
    I.attachFile('.io-ox-calendar-edit-window input[type="file"]', 'e2e/media/files/generic/testdocument.rtf');

    // Expected Result: Attachments get added to the edit dialog
    I.see('testdocument.odt');
    I.see('testdocument.rtf');

    // 4. Save the appointment and check it in all calendar views
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // Expected Result: The appointment now contains the added files as attachments. These attachments can be downloaded and correspond to the files that have been uploaded.
    const seeAttachments = (context) => {
        I.waitForElement(context);
        I.see(subject, context);
        I.see('testdocument.odt', context);
        I.see('testdocument.rtf', context);
    };
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForText(subject, 5, '.page.current .appointment');
        I.click(subject, '.page.current .appointment');
        if (view === 'List') {
            seeAttachments('.calendar-detail-pane');
        } else {
            seeAttachments('.io-ox-sidepopup');
        }
    });
    // TODO: check if attachments can be downloaded and compared with the original files
});

Scenario('[C7456] Edit appointment via Drag & Drop', async function (I, users) {

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'Brexit',
        description: 'Ooordeeeer! This appointment is moved constantly.',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('day').add(13, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('day').add(12, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    I.login('app=io.ox/calendar&perspective=week:day');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.dragAndDrop('.appointment .appointment-content', '.day .timeslot:nth-child(27)');

    I.see('1:00 – 2:00 PMCEST');

    I.clickToolbar('View');
    I.click('Week', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.see('1:00 – 2:00 PMCEST');

    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.see('1:00 – 2:00 PMCEST');

    I.clickToolbar('View');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);

    I.see('1:00 PM');
    I.see('2:00 PM');
});
