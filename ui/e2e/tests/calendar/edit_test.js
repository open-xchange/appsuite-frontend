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
const expect = require('chai').expect;

Feature('Calendar > Edit');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    const { I } = inject();
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7449] Move appointment to folder', async ({ I, calendar, dialogs }) => {
    const folder = await calendar.defaultFolder();
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: folder });
    await I.haveAppointment({
        folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    if (!moment().isSame(time, 'month')) I.retry(5).click('~Go to next month', calendar.locators.mini);
    I.retry(5).click(`~${time.format('l, dddd')}, CW ${time.week()}`, calendar.locators.mini);

    // open all views and load the appointment there
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        calendar.switchView(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
    });

    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup');

    I.waitForVisible(locate('~More actions').inside('.io-ox-sidepopup'));
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Move');

    dialogs.waitForVisible();
    within('.modal-dialog', () => {
        I.click('.folder-arrow', '~My calendars');
        I.waitForVisible({ css: '[title="New calendar"]' });
        I.click({ css: '[title="New calendar"]' });
    });
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');

    // disable the other folder
    I.wait(1);
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });
    I.click({ css: '[title="New calendar"] .color-label' });
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="false"]' });

    // open all views and verify that the appointment is gone
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        calendar.switchView(view);
        I.waitForInvisible('.page.current .appointment');
        I.dontSee('Testappointment');
    });

    // enable the other folder
    I.click({ css: '[title="New calendar"] .color-label' });
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });

    // open all views and verify that the appointment is there again
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        calendar.switchView(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
    });
});

Scenario('[C7450] Edit private appointment', async ({ I, calendar }) => {
    const folder = await calendar.defaultFolder();
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder,
        summary: 'Testappointment',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
        class: 'CONFIDENTIAL'
    });

    I.login('app=io.ox/calendar');

    if (!moment().isSame(time, 'month')) I.retry(5).click('~Go to next month', '.window-sidepanel');
    I.retry(5).click(`~${time.format('l, dddd')}, CW ${time.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        calendar.switchView(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
        I.seeElement('.fa-lock', '~Testappointment');
    });

    // edit the appointment
    I.doubleClick('.page.current .appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).selectOption('Visibility', 'Standard');

    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');

    // Check all views
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        calendar.switchView(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
        I.waitForInvisible(locate('.fa-lock').inside('~Testappointment').inside('.page.current'));
    });

});

Scenario('[OXUIB-818] Edit public appointment when folder not checked', async ({ I, calendar }) => {
    const folder = await I.haveFolder({ title: 'myPublic', module: 'event', subscribed: '1', parent: '2' });
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    I.say(folder);
    await I.haveAppointment({
        folder,
        summary: 'Testappointment',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
        class: 'PUBLIC'
    });

    // load
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.waitForText('Testappointment');

    // check
    I.doubleClick('.page.current .appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForText('Save');
    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');
});

Scenario('[C7451] Edit yearly series via doubleclick', async ({ I, calendar }) => {
    const time = moment('1612', 'DDMM').add(10, 'hours');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testappointment',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
        rrule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=16'
    });

    I.login('app=io.ox/calendar');
    I.waitForElement('~Go to next month');

    // select the next 16.th december via the mini calendar
    const diffMonth = time.diff(moment().startOf('month'), 'months');
    for (let i = 0; i < diffMonth; i++) I.click('~Go to next month', calendar.locators.mini);
    I.click({ css: `[aria-label*="${time.format('l, dddd')}, CW ${time.week()}"]` }, calendar.locators.mini);

    calendar.switchView('Week');
    I.waitForVisible(`.page.current .day:nth-child(${time.weekday() + 2}) .appointment`);
    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup .inline-toolbar-container');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
    I.wait(0.5); // gently wait for listeners
    await calendar.setDate('startDate', time.add(1, 'day'));

    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.waitForVisible(`.page.current .day:nth-child(${time.weekday() + 2}) .appointment`);

    time.add(1, 'year');
    for (let i = 0; i < 12; i++) I.click('~Go to next month', calendar.locators.mini);
    I.click(`~${time.format('l, dddd')}, CW ${time.week()}`, calendar.locators.mini);

    I.waitForVisible(`.page.current .day:nth-child(${time.weekday() + 2}) .appointment`);
});

Scenario('[C7464] Change appointment in shared folder as guest', async ({ I, users, calendar }) => {
    const time = moment().startOf('week').add(3, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testappointment',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }]
    });

    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForText('Testappointment');

    I.doubleClick('.appointment');
    I.wait(1);
    I.dontSeeElement('.io-ox-calendar-edit-window');
});

Scenario('[C7465] Edit appointment in shared folder as author', async ({ I, users, calendar }) => {
    const folder = await I.haveFolder({ title: 'New calendar', module: 'event', parent: await calendar.defaultFolder() });
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    const busystate = locate('.modal modal-body.invisible');

    I.waitForText('New calendar');
    I.rightClick({ css: '[aria-label^="New calendar"]' });
    I.waitForText('Share / Permissions');
    I.wait(0.2); // Just wait a little extra for all event listeners
    I.click('Share / Permissions');
    I.waitForText('Permissions for calendar "New calendar"');
    I.waitForDetached(busystate);
    I.wait(0.5);
    I.fillField('.modal-dialog .tt-input', users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForDetached('.share-permissions-dialog');

    I.logout();

    I.login('app=io.ox/calendar', { user: users[1] });

    I.waitForElement('.folder[data-id="virtual/flat/event/shared"]');
    // switch on New calendar
    I.click('.folder[data-id="virtual/flat/event/shared"] .folder-arrow');
    I.click({ css: `[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar"] .color-label` });
    I.click('~Next Week', '.page.current');

    I.waitForText('Testappointment');

    // 1. Double click to the appointment
    I.doubleClick('.page.current .appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 2. Change Subject, Location and Description.
    I.retry(5).fillField('Subject', 'Changedappointment');
    I.fillField('Location', 'Changedlocation');
    I.fillField('Description', 'Changeddescription');

    // 3. Click "Save"
    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');

    // 4. Check this appointment in all views.
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        calendar.switchView(view);
        I.waitForVisible(locate('.appointment').inside('.page.current'));
        I.click('.appointment', '.page.current');
        I.waitForText('Changedappointment', 5, '.calendar-detail');
        I.see('Changedlocation');
        I.see('Changeddescription');
    });
});

Scenario('[C234659] Split appointment series', async ({ I, users, calendar, dialogs }) => {
    I.login('app=io.ox/calendar');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Testsubject');
    await calendar.setDate('startDate', moment().startOf('week').add(1, 'day'));
    I.click('~Start time');
    I.click('4:00 PM');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForText('Testsubject');
    I.seeNumberOfElements('.appointment', 5);

    // click on the second .appointment
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup .inline-toolbar-container');

    I.click('Edit');
    I.waitForText('Do you want to edit this and all future appointments or just this appointment within the series?');
    I.click('Edit all future appointments');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('input.add-participant.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');

    // save
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.dontSee(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.see(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, '.io-ox-sidepopup');
});

Scenario('[C234679] Exceptions changes on series modification', async ({ I, calendar, dialogs }) => {
    I.login('app=io.ox/calendar');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Testsubject');
    await calendar.setDate('startDate', moment().startOf('week').add(1, 'day'));
    I.click('~Start time');
    I.click('4:00 PM');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // assert existance
    I.waitForText('Testsubject');
    I.seeNumberOfElements('.appointment', 5);

    // click on the second .appointment and edit it
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');

    I.waitForText('Edit', undefined, '.io-ox-sidepopup');
    I.click('Edit');
    I.waitForText('Do you want to edit this and all future appointments or just this appointment within the series?');
    I.click('Edit this appointment');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).click('~Start time');
    I.click('5:00 PM');

    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // click on the first .appointment and edit it
    I.click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');

    I.waitForText('Edit', undefined, '.io-ox-sidepopup');
    I.click('Edit');
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Changedsubject');

    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForText('Changedsubject', undefined, '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Changedsubject', undefined, '.io-ox-sidepopup');

});

Scenario('[C7467] Delete recurring appointment in shared folder as author', async ({ I, users, calendar }) => {
    const folder = await I.haveFolder({ title: 'New calendar', module: 'event', parent: await calendar.defaultFolder() });
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    const busystate = locate('.modal modal-body.invisible');
    await I.haveAppointment({
        folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        rrule: 'FREQ=DAILY;COUNT=5'
    });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar');

    I.waitForText('New calendar');
    I.rightClick({ css: '[aria-label^="New calendar"]' });
    I.waitForText('Share / Permissions');
    I.wait(0.2); // Just wait a little extra for all event listeners
    I.click('Share / Permissions');
    I.waitForText('Permissions for calendar "New calendar"');
    I.waitForDetached(busystate);
    I.wait(0.5);
    I.fillField('.modal-dialog .tt-input', users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitForDetached('.share-permissions-dialog');

    I.logout();

    I.login('app=io.ox/calendar', { user: users[1] });

    I.waitForElement({ css: '[data-id="virtual/flat/event/shared"]' });
    // switch on New calendar
    I.doubleClick('~Shared calendars');
    I.click({ css: `[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar"] .color-label` });

    I.waitForText('Testappointment');

    // delete appointment
    I.click('.page.current .appointment');

    I.waitForText('Delete', 5, '.io-ox-sidepopup .inline-toolbar');
    I.click('Delete', '.io-ox-sidepopup .inline-toolbar-container');

    I.waitForText('Do you want to delete all appointments of the series or just this appointment?');
    I.click('Delete all appointments');

    I.waitForDetached('.io-ox-sidepopup');

    I.waitForInvisible('.appointment');
});

Scenario('[C7470] Delete a recurring appointment', async ({ I, calendar }) => {
    const folder = await I.haveFolder({ title: 'New calendar', module: 'event', parent: await calendar.defaultFolder() });
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder,
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
        calendar.switchView(view);
        if (view === 'Day') I.click({ css: `.date-picker td[aria-label*="${time.format('M/D/YYYY')}"]` });
        I.waitForVisible(locate('.appointment').inside('.page.current'));
    });

    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup');

    I.wait(0.2); // gentle wait for event listeners
    I.retry(5).click('Delete');

    I.waitForText('Do you want to delete all appointments of the series or just this appointment?');
    I.click('Delete all appointments');

    I.waitForDetached('.io-ox-sidepopup');

    I.waitForInvisible(locate('.appointment').inside('.page.current'));
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        calendar.switchView(view);
        I.dontSee('.appointment', '.page.current');
    });
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario('[C274402] Change organizer of appointment with internal attendees', async ({ I, users, calendar, dialogs }) => {
    await I.haveSetting({ 'io.ox/calendar': { 'chronos/allowChangeOfOrganizer': true } });
    const time = moment().startOf('week').add(3, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testsubject',
        location: 'Testlocation',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }]
    });
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.waitForText('Testsubject');
    I.click('.appointment');

    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.waitForText(`${users[0].userdata.display_name}`, 5, '.io-ox-sidepopup .details .organizer');

    I.wait(0.2); // gently wait for event listeners
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Change organizer');

    dialogs.waitForVisible();
    I.waitForText('Change organizer', 5, dialogs.locators.header);
    I.fillField('Select new organizer', users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');

    I.fillField('Add a message to the notification email for the other participants.', 'Testcomment');
    dialogs.clickButton('Change');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible(locate('.io-ox-label a.expandable-toggle').withText('Details').inside('.io-ox-sidepopup'));
    I.retry(5).click('Details');
    I.waitForText(`${users[1].userdata.display_name}`, 5, '.io-ox-sidepopup .details .organizer');
});

Scenario('[C274409] Change organizer of series with internal attendees', async ({ I, users, calendar, dialogs }) => {
    await I.haveSetting({ 'io.ox/calendar': { 'chronos/allowChangeOfOrganizer': true } });
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testsubject',
        location: 'Testlocation',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
        attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }],
        rrule: 'FREQ=DAILY;COUNT=5'
    });
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.waitForText('Testsubject');
    I.waitForEnabled(locate('.appointment').at(2));
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Details', 5, '.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.waitForText(`${users[0].userdata.display_name}`, 5, '.io-ox-sidepopup .details .organizer');

    I.wait(0.2); // gently wait for event listeners
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Change organizer');

    I.waitForText('Do you want to edit this and all future appointments or the whole series?');
    I.click('Edit all future appointments');

    dialogs.waitForVisible();
    I.waitForText('Change organizer', 5, dialogs.locators.header);
    I.fillField('Select new organizer', users[1].userdata.primaryEmail);
    I.waitForVisible(locate('*').withText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`).inside('.tt-dropdown-menu'));
    I.pressKey('ArrowDown');
    I.pressKey('Enter');

    I.fillField('Add a message to the notification email for the other participants.', 'Testcomment');
    dialogs.clickButton('Change');
    I.waitForDetached('.modal-dialog');

    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');

    I.waitForEnabled(locate('.appointment').at(2));
    I.wait(0.3);
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Details', 5, '.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.waitForText(`${users[1].userdata.display_name}`, 5, '.io-ox-sidepopup .details .organizer');
    I.click('~Close', '.io-ox-sidepopup');

    I.waitForEnabled(locate('.appointment').at(1));
    I.click(locate('.appointment').at(1));
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Details', 5, '.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.waitForText(`${users[0].userdata.display_name}`, 5, '.io-ox-sidepopup .details .organizer');
});

// TODO: shaky, msg: 'Text "Do you want to delete all appointments of the series or just this appointment?" was not found on page after 5 sec'
Scenario('[C265149] As event organizer I can add a textual reason why an event was canceled', async ({ I, users, calendar, dialogs }) => {
    await I.haveSetting({ 'io.ox/calendar': { notifyNewModifiedDeleted: true } });
    const folder = await calendar.defaultFolder();
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    // single appointment without additional participants
    await Promise.all([
        I.haveAppointment({
            folder,
            summary: 'Appointment1',
            startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') }
        }),
        // recurring appointment without additional participants
        I.haveAppointment({
            folder,
            summary: 'Appointment2',
            startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
            rrule: 'FREQ=DAILY;COUNT=5'
        }),
        // single appointment with additional participants
        I.haveAppointment({
            folder,
            summary: 'Appointment3',
            startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
            attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }]
        }),
        // recurring appointment with additional participants
        I.haveAppointment({
            folder,
            summary: 'Appointment4',
            startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
            attendees: [{ entity: users[0].userdata.id }, { entity: users[1].userdata.id }],
            rrule: 'FREQ=DAILY;COUNT=5'
        })
    ]);

    I.login('app=io.ox/calendar');

    // Delete single appointment without additional participants => no comment field
    I.waitForVisible('.appointment');
    I.click('Appointment1', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Delete', 5, '.io-ox-sidepopup');
    I.retry(5).click('Delete', '.io-ox-sidepopup');
    dialogs.waitForVisible();
    I.waitForText('Do you really want to delete this appointment?', 5, dialogs.locators.body);
    dialogs.clickButton('Delete appointment');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete recurring appointment without additional participants => no comment field
    I.click('Appointment2', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Delete', 5, '.io-ox-sidepopup');
    I.retry(5).click('Delete', '.io-ox-sidepopup');
    dialogs.waitForVisible();
    I.waitForText('Do you want to delete all appointments of the series or just this appointment?', 5, dialogs.locators.body);
    dialogs.clickButton('Delete all appointments');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete single appointment with additional participants => comment field
    I.click('Appointment3', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Delete', 5, '.io-ox-sidepopup');
    I.retry(5).click('Delete', '.io-ox-sidepopup');
    dialogs.waitForVisible();
    I.waitForText('Delete appointment', 5, dialogs.locators.header);
    I.waitForText('Add a message to the notification email for the other participants.', 5, dialogs.locators.body);
    dialogs.clickButton('Delete appointment');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete recurring appointment with additional participants => comment field
    I.click('Appointment4', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Delete', 5, '.io-ox-sidepopup');
    I.retry(5).click('Delete', '.io-ox-sidepopup');
    dialogs.waitForVisible();
    I.waitForText('Delete appointment', 5, dialogs.locators.header);
    I.waitForText('Add a message to the notification email for the other participants.', 5, dialogs.locators.body);
    dialogs.clickButton('Delete all appointments');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

});

Scenario('[C7452] Edit weekly recurring appointment via Drag&Drop', async ({ I, calendar }) => {
    await I.haveSetting({ 'io.ox/calendar': { notifyNewModifiedDeleted: true } });
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    // recurring appointment without additional participants
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testappointment',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') },
        rrule: 'FREQ=WEEKLY;BYDAY=MO;INTERVAL=2;COUNT=3'
    });

    I.login('app=io.ox/calendar');

    I.waitForText('Testappointment');
    I.see('Testappointment', locate('.page.current .day').at(1));
    I.scrollTo('.page.current .appointment');
    I.dragAndDrop('.page.current .appointment', locate('.page.current .day').at(2).find('.timeslot').at(21));
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForInvisible('.page.current .appointment.io-ox-busy');
    I.see('Testappointment', locate('.page.current .day').at(2));

    calendar.switchView('Week');

    I.waitForVisible('.page.current .appointment');
    I.see('Testappointment', locate('.page.current .day').at(3));

    // use 5th child here as the container has another child before the first .day
    I.scrollTo('.page.current .appointment');
    I.dragAndDrop(locate('.page.current .appointment'), locate('.page.current .day').at(4).find('.timeslot').at(21));
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForInvisible('.page.current .appointment.io-ox-busy');
    I.see('Testappointment', locate('.page.current .day').at(4));

    calendar.switchView('Month');

    I.waitForVisible('.page.current .appointment');
    time.add(2, 'days');
    I.see('Testappointment', { css: `[id="${time.format('YYYY-M-D')}"]` });

    time.add(1, 'day');
    I.scrollTo('.page.current .appointment');
    I.dragAndDrop(locate('.page.current .appointment'), `[id="${time.format('YYYY-M-D')}"]`);
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForInvisible('.page.current .appointment.io-ox-busy');
    I.see('Testappointment', { css: `[id="${time.format('YYYY-M-D')}"]` });
});

Scenario('[C7453] Edit appointment, set the all day checkmark', async ({ I, calendar }) => {
    await I.haveSetting({ 'io.ox/calendar': { 'chronos/allowChangeOfOrganizer': true } });
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testsubject',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') }
    });
    const appointment = locate('.page.current .appointment-container .appointment')
        .withText('Testsubject')
        .as('Test appointment container');

    I.login('app=io.ox/calendar');
    I.waitForElement(appointment);

    I.doubleClick('.page.current .appointment');
    I.waitForElement('.io-ox-calendar-edit-window');
    I.waitForText('All day');
    I.checkOption('All day');
    I.click('Save');

    I.waitForInvisible(appointment);
    I.waitForVisible(locate('.page.current .fulltime-container .appointment').withText('Testsubject'));

});

Scenario('[C7457] Edit appointment via toolbar', async ({ I, calendar }) => {
    await I.haveSetting({ 'io.ox/calendar': { 'chronos/allowChangeOfOrganizer': true } });
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Testsubject',
        location: 'Testlocation',
        description: 'Testdescription',
        startDate: { tzid: 'Europe/Berlin', value: time.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss') }
    });

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    // select the according day in the mini datepicker
    if (!moment().isSame(time, 'month')) I.retry(5).click('~Go to next month', calendar.locators.mini);
    I.retry(5).click(`~${time.format('l, dddd')}, CW ${time.week()}`, calendar.locators.mini);

    // open all views and load the appointment there
    ['Day', 'Month', 'List', 'Week', 'Workweek'].forEach((view) => {
        calendar.switchView(view);
        I.waitForVisible(locate('*').withText('Testsubject').inside('.page.current'));
    });

    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup');
    // wait for toolbar to settle
    I.wait(0.5);
    I.retry(5).click('Edit');

    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).fillField('Subject', 'Newsubject');
    I.fillField('Location', 'Newlocation');
    I.fillField('Description', 'Newdescription');
    I.click('Save');

    // open all views and check the appointment there
    ['Day', 'Month', 'List', 'Week', 'Workweek'].forEach((view) => {
        calendar.switchView(view);
        I.retry(5).click('.appointment', '.page.current');
        if (view !== 'List') I.waitForVisible('.io-ox-sidepopup');
        I.retry(5).see('Newsubject', '.calendar-detail');
        I.see('Newlocation', '.calendar-detail');
        I.see('Newdescription', '.calendar-detail');
        if (view !== 'List') I.click('~Close', '.io-ox-sidepopup');
    });
});

Scenario('[C7454] Edit appointment, all-day to one hour', async ({ I, users, calendar }) => {
    const { id, given_name, sur_name, primaryEmail } = users[0].userdata;
    const momentRange = require('moment-range').extendMoment(moment);
    const testrailID = 'C7454';
    const appointmentSelector = { css: `[title="${testrailID}, ${testrailID}"]` };
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        startDate: { tzid: 'Europe/Berlin', value: momentRange().format('YYYYMMDD') },
        endDate:   { tzid: 'Europe/Berlin', value: momentRange().format('YYYYMMDD') },
        attendees: [
            {
                cuType: 'INDIVIDUAL',
                cn: `${given_name} ${sur_name}`,
                partStat: 'ACCEPTED',
                entity: id,
                email: primaryEmail,
                uri: `mailto:${primaryEmail}`,
                contact: {
                    display_name: `${given_name} ${sur_name}`,
                    first_name: given_name,
                    last_name: sur_name
                }
            }
        ]
    });

    I.login('app=io.ox/calendar&perspective=week:week');
    I.waitForVisible({ css: '.io-ox-calendar-window' });
    I.clickToolbar('Today');
    I.waitForElement(appointmentSelector, 5);
    I.click(appointmentSelector);
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText('Edit', 5, '.io-ox-sidepopup');
    I.click('Edit');
    I.waitForElement({ css: '[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit' }, 5);
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit' }, 5);
    I.uncheckOption({ css: 'input[name="allDay"]' });
    I.click('~Start time');
    I.click({ css: '[data-attribute="startDate"] [data-value="12:00 PM"]' }, '.dropdown-menu.calendaredit');
    I.click('~End time');
    I.click({ css: '[data-attribute="endDate"] [data-value="1:00 PM"]' });
    I.click('Save');
    I.waitForDetached({ css: '[data-app-name="io.ox/calendar/edit"] .io-ox-calendar-edit' });
    I.waitForElement(appointmentSelector, 5);
    I.wait(0.3);
    I.click(appointmentSelector);
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForText('12:00 – 1:00 PM');
});

Scenario('[C7462] Remove a participant', async ({ I, users, calendar }) => {
    const testrailID = 'C7462';
    await I.haveSetting('io.ox/calendar//viewView', 'week:week');

    //Create Appointment
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        startDate: { tzid: 'Europe/Berlin', value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') },
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
    });
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label^="' + testrailID + ', ' + testrailID + '"]');
    I.click('.appointment-container [aria-label^="' + testrailID + ', ' + testrailID + '"]');
    I.waitForVisible('.io-ox-calendar-main .io-ox-sidepopup');
    I.waitForElement({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForElement('.io-ox-sidepopup-pane a[title="' + users[1].userdata.primaryEmail + '"]');
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForVisible('.io-ox-calendar-edit.container');
    I.waitForElement({ xpath: '//a[contains(text(),"' + users[1].userdata.primaryEmail + '")]/../../a[contains(@class, "remove")]' });
    I.click({ xpath: '//a[contains(text(),"' + users[1].userdata.primaryEmail + '")]/../../a[contains(@class, "remove")]' });
    I.waitForDetached({ xpath: '//a[contains(text(),"' + users[1].userdata.primaryEmail + '")]/../../a[contains(@class, "remove")]' });
    I.click('Save');
    I.waitForDetached('.floating-window-content');
    I.waitForVisible('.io-ox-calendar-main .io-ox-sidepopup');
    I.waitForElement({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForText('Participants');
    I.wait(0.3);
    I.dontSeeElement('.io-ox-sidepopup-pane a[title="' + users[1].userdata.primaryEmail + '"]');
});

Scenario('[C7461] Add a participant/ressource', async ({ I, users, calendar, mail }) => {
    const timestamp = Math.round(+new Date() / 1000);
    const resourceName = `C7461 ${timestamp}`;
    const resourceMail = `C7461@${timestamp}.de`;
    const groupName = `C7461 ${timestamp} Group`;

    await Promise.all([
        users.create(),
        users.create(),
        I.dontHaveResource(resourceName),
        I.dontHaveGroup(groupName),
        I.haveSetting({ 'io.ox/calendar': { notifyNewModifiedDeleted: true, separateExternalParticipantList: true } })
    ]);

    const [userA, userB, weebl, bob] = users;

    // Precondition: A simple appointment already exists
    // having the appointment at the end of the day (11:00PM-12:00AM) assures that userB will receive a notification
    const startTime = moment().startOf('day').add(23, 'hour').format('YYYYMMDD[T]HHmmss');
    const endTime = moment().startOf('day').add(24, 'hour').format('YYYYMMDD[T]HHmmss');
    const subject = `${userA.userdata.name}s awesome appointment`;

    await Promise.all([
        I.haveResource({ description: 'Evil sharks equipped with lazers', display_name: resourceName, name: resourceName, mailaddress: resourceMail }),
        I.haveGroup({ name: groupName, display_name: groupName, members: [weebl.userdata.id, bob.userdata.id] }),
        I.haveAppointment({
            folder: `cal://0/${await I.grabDefaultFolder('calendar', { user: userA })}`,
            summary: subject,
            startDate: { tzid: 'Europe/Berlin', value: startTime },
            endDate:   { tzid: 'Europe/Berlin', value: endTime }
        }, { user: userA })
    ]);

    // 1. Switch to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });

    // Expected Result: The calendar app is shown, including the existing appointment
    calendar.waitForApp();
    I.waitForText(subject, 5, '.appointment');

    // 2. Select the appointment and click "Edit"
    I.retry(5).click(subject, '.appointment');
    I.waitForElement('.io-ox-sidepopup');
    I.waitForText('Edit', 5, '.io-ox-sidepopup');
    I.click('Edit');

    // Expected Result: The edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');

    // 3. Locate the "Participants" section and add some OX users, groups and resources as participants. This may include external mail accounts which are not handled by OX
    await calendar.addParticipant(userB.userdata.primaryEmail);
    await calendar.addParticipant(groupName, true, undefined, 2);
    await calendar.addParticipant(resourceName);
    await calendar.addParticipant('foo@bar', false);
    // Expected Result: The participants area is populating with people that got added to the appointment.
    I.waitForText(userA.userdata.primaryEmail, 5, calendar.locators.participants);
    I.waitForText(userB.userdata.primaryEmail, 5, calendar.locators.participants);
    I.waitForText(weebl.userdata.primaryEmail, 5, calendar.locators.participants);
    I.waitForText(bob.userdata.primaryEmail, 5, calendar.locators.participants);
    I.waitForText('foo@bar', 5, calendar.locators.participants);

    // 4. Save the appointment and check it in all calendar views
    const getSectionLocator = (sectionName) => locate('fieldset').withDescendant(locate('h2').withText(sectionName));
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // Expected Result: The appointment has been modified and all resources, groups, participants are displayed at the appointment popup.
    // Their confirmation status is indicated as well and they're ordered by their type (internal, external, resource).
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, () => {
        I.waitForText(subject, 5, '.page.current .appointment');
        I.click(subject, '.page.current .appointment');
        if (perspective === 'List') {
            I.waitForVisible('.calendar-detail-pane');
            I.waitForText(subject, '.calendar-detail-pane');
        } else {
            I.waitForVisible('.io-ox-sidepopup');
            I.waitForText(subject, '.io-ox-sidepopup');
        }
        I.waitForElement({ css: 'a[aria-label="unconfirmed 4"]' });
        I.waitForElement({ css: 'a[aria-label="accepted 1"]' });
        [
            `${userA.userdata.sur_name}, ${userA.userdata.given_name}`,
            `${userB.userdata.sur_name}, ${userB.userdata.given_name}`,
            `${weebl.userdata.sur_name}, ${weebl.userdata.given_name}`,
            `${bob.userdata.sur_name}, ${bob.userdata.given_name}`
        ].forEach(name => I.waitForText(name, getSectionLocator('Participants')));
        I.waitForElement(locate(`a.accepted[title="${userA.userdata.primaryEmail}"]`).inside(getSectionLocator('Participants')));
        I.waitForText('foo', getSectionLocator('External participants'));
        I.waitForText(resourceName, getSectionLocator('Resources'));
    }));

    // 5. Check the mail inbox of one of the participants.
    I.logout();
    I.login(['app=io.ox/mail'], { user: userB });
    mail.waitForApp();

    // Expected Result: A mail has been received, informing about the new appointment.
    let mailCount = await I.grabNumberOfVisibleElements('.list-item');
    let retries = 60;
    while (mailCount < 1) {
        if (retries > 0) {
            I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
            I.click('#io-ox-refresh-icon', '.taskbar');
            I.waitForElement('.launcher .fa-spin-paused', 5);
            I.say('No mail(s) found. Waiting 10 seconds ...');
            I.wait(10);
            mailCount = await I.grabNumberOfVisibleElements('.list-item');
            retries--;
        } else {
            I.say('Timeout exceeded. No mails found.');
            break;
        }
    }

    I.retry(3).waitForElement({ css: `span[title="New appointment: ${subject}"]` });
});

Scenario('[C7455] Edit appointment by changing the timeframe', async ({ I, calendar }) => {
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'Dinner for one',
        startDate: { tzid: 'Europe/Berlin', value: moment().startOf('day').add(12, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().startOf('day').add(13, 'hours').format('YYYYMMDD[T]HHmm00') }
    });

    I.login('app=io.ox/calendar&perspective=week:day');
    calendar.waitForApp();

    I.waitForVisible('.appointment');
    I.scrollTo('.page.current .timeslot:nth-child(23)');
    I.dragAndDrop('.appointment .resizable-n', '.day .timeslot:nth-child(23)');
    I.waitForVisible('.appointment:not(.resizing) .appointment-content');
    I.waitForDetached('.appointment.io-ox-busy');
    I.wait(0.1);
    I.retry(5).click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('11:00 – 1:00 PM');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');
    I.scrollTo('.page.current .timeslot:nth-child(28)');
    I.dragAndDrop('.appointment .resizable-s', '.day .timeslot:nth-child(28)');
    I.waitForVisible('.page.current .appointment:not(.resizing) .appointment-content');
    I.waitForDetached('.appointment.io-ox-busy');
    I.wait(0.1);
    I.retry(5).click('.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('11:00 – 2:00 PM');
    I.retry(5).click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');

    calendar.switchView('Week');
    I.retry(5).click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('11:00 – 2:00 PM');

    calendar.switchView('Month');
    I.retry(5).click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('11:00 – 2:00 PM');

    calendar.switchView('List');
    I.waitForText('11:00 AM');
    I.waitForText('2:00 PM');
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario('[C7460] Add attachments', async ({ I, calendar }) => {
    // Precondition: An appointment already exists
    const startTime = moment().startOf('day').add(13, 'hour');
    const endTime = moment().startOf('day').add(15, 'hour');
    const summary = `Tiny Tinas ${startTime.format('h a')}s Tea Party`;

    await Promise.all([
        I.haveSetting({ 'io.ox/calendar': { notifyNewModifiedDeleted: true } }),
        I.haveAppointment({
            folder: await calendar.defaultFolder(),
            summary,
            startDate: { tzid: 'Europe/Berlin', value: startTime.format('YYYYMMDD[T]HHmmss') },
            endDate:   { tzid: 'Europe/Berlin', value: endTime.format('YYYYMMDD[T]HHmmss') }
        })
    ]);

    // 1. Switch to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week']);
    calendar.waitForApp();
    I.waitForElement(locate('.appointment').withText(summary));

    // 2. Select the existing appointment, click "Edit"
    I.click(summary, '.appointment');
    I.waitForText('Edit', undefined, '.io-ox-sidepopup');
    I.click('Edit');

    // Expected Result: The appointment edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');

    // 3. Locate the "Attachments" area and add files as attachments either by the browsers upload dialog or drag&drop from the file manager or desktop
    I.pressKey('Pagedown');
    I.see('Attachments', '.io-ox-calendar-edit-window');
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
        I.see(summary, context);
        I.see('testdocument.odt', context);
        I.see('testdocument.rtf', context);
    };
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        calendar.switchView(view);
        I.waitForText(summary, 5, '.page.current .appointment');
        I.click(summary, '.page.current .appointment');
        if (view === 'List') seeAttachments('.calendar-detail-pane');
        else seeAttachments('.io-ox-sidepopup');
    });
    // TODO: check if attachments can be downloaded and compared with the original files
});

Scenario('[C7456] Edit appointment via Drag & Drop', async ({ I, calendar }) => {
    const summary = 'Brexit';
    //Create Appointment
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary,
        description: 'Ooordeeeer! This appointment is moved constantly.',
        startDate: { tzid: 'Europe/Berlin', value: moment().startOf('day').add(12, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().startOf('day').add(13, 'hours').format('YYYYMMDD[T]HHmm00') }
    });

    I.login('app=io.ox/calendar&perspective=week:day');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    I.waitForElement('.appointment');
    // have to scroll appointment into view for drag & drop to work

    // select first appointment element
    I.executeScript(() => $('.appointment-content')[0].scrollIntoView(true));

    I.dragAndDrop('.appointment .appointment-content', '.day .timeslot:nth-child(27)');
    I.wait(0.5);

    I.click(summary, '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('1:00 – 2:00 PM');

    calendar.switchView('Week');
    I.retry(5).click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('1:00 – 2:00 PM');

    calendar.switchView('Month');
    I.retry(5).click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('1:00 – 2:00 PM');

    calendar.switchView('List');
    I.wait(1);
    I.waitForText('1:00 PM');
    I.waitForText('2:00 PM');
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario('[C7459] Remove attachments', async ({ I, calendar }) => {
    await I.haveSetting({ 'io.ox/calendar': { notifyNewModifiedDeleted: true } });

    // Precondition: An appointment with file attachment exists
    const startTime = moment().startOf('day').add(1, 'hour');
    const endTime = moment().startOf('day').add(2, 'hour');
    const summary = `Allhands ${startTime.format('h A')} Meeting`;
    const appointment = await I.haveAppointment({
        folder: `cal://0/${await I.grabDefaultFolder('calendar')}`,
        summary,
        startDate: { tzid: 'Europe/Berlin', value: startTime.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: endTime.format('YYYYMMDD[T]HHmmss') }
    });
    const updatedAppointment = await I.haveAttachment('calendar', appointment, 'e2e/media/files/generic/testdocument.odt');
    await I.haveAttachment('calendar', updatedAppointment, 'e2e/media/files/generic/testdocument.rtf');

    // 1. Switch to Calendar
    I.login('app=io.ox/calendar&perspective=week:week');

    // Expected Result: The calendar app shows up, including the existing appointment
    calendar.waitForApp();
    I.waitForVisible('.appointment');
    I.see(summary, '.appointment');

    // 2. Select the existing appointment, click "Edit"
    I.click(summary, '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Edit');
    I.click('Edit');

    // Expected Result: The edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');

    // 3. At the edit dialog, locate the Attachments area and remove one or more attachments from the appointment
    I.pressKey('Pagedown');
    I.see('Attachments', '.io-ox-calendar-edit-window');

    // Expected Result: The attachments are not longer shown at the edit dialog
    I.click({ css: 'a[title="Remove attachment"]' }, locate('div.file').withDescendant(locate('div').withText('testdocument.odt')));
    I.dontSee('testdocument.odt', '.io-ox-calendar-edit-window');
    I.see('testdocument.rtf', '.io-ox-calendar-edit-window');
    I.click({ css: 'a[title="Remove attachment"]' }, locate('div.file').withDescendant(locate('div').withText('testdocument.rtf')));
    I.dontSee('testdocument.odt', '.io-ox-calendar-edit-window');
    I.dontSee('testdocument.rtf', '.io-ox-calendar-edit-window');

    // 4. Save the appointment and verify it in all calendar views
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // Expected Result: The appointment does not contain the attachment anymore
    const dontSeeAttachments = (context) => {
        I.waitForElement(context);
        I.waitForText(summary, 5, context);
        I.dontSee('testdocument.odt', context);
        I.dontSee('testdocument.rtf', context);
    };
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        calendar.switchView(view);
        I.waitForText(summary, 5, '.page.current .appointment');
        I.click(summary, '.page.current .appointment');
        if (view === 'List') dontSeeAttachments('.calendar-detail-pane');
        else dontSeeAttachments('.io-ox-sidepopup');
    });
});

Scenario('[C7458] Edit appointment by doubleclick', async ({ I, calendar }) => {
    await I.haveSetting({ 'io.ox/calendar': { notifyNewModifiedDeleted: true } });

    // You already had created a non all-day appointment
    const startTime = moment().startOf('day').add(1, 'hour');
    const endTime = moment().startOf('day').add(2, 'hour');
    const subject = `Mr. Torques ${startTime.format('h a')} explosions`;
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: subject,
        startDate: { tzid: 'Europe/Berlin', value: startTime.format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: endTime.format('YYYYMMDD[T]HHmmss') }
    });

    // 1. Double click to an appointment
    I.login(['app=io.ox/calendar&perspective=week:week']);
    calendar.waitForApp();
    I.waitForText(subject, 5, '.appointment');
    I.doubleClick('.page.current .appointment');

    // Expected Result: Edit tab is opened.
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 2. Change Subject, Location and Description.
    const explosions = 'EXPLOSIONS';
    const explosionSubject = `${explosions} at ${startTime.format('h a')}`;
    const description = `Lorem ${explosions} sit dolor!`;
    I.retry(5).fillField('Subject', explosionSubject);
    I.fillField('Location', 'Pandora');
    I.fillField('Description', description);

    // 3. Click "Save"
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // 4. Check this appointment in all views.
    // Expected Result: The appointment has been changed successfully.
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        calendar.switchView(view);
        I.waitForText(explosionSubject, 5, '.page.current .appointment');
        I.click(explosionSubject, '.page.current .appointment');
        if (view === 'List') {
            I.waitForText(explosionSubject, 5, '.calendar-detail-pane');
            I.waitForText('Pandora', 5, '.calendar-detail-pane');
            I.waitForText(description, 5, '.calendar-detail-pane');
        } else {
            I.waitForText(explosionSubject, 5, '.io-ox-sidepopup');
            I.waitForText('Pandora', 5, '.io-ox-sidepopup');
            I.waitForText(description, 5, '.io-ox-sidepopup');
        }
    });
});

Scenario('[C7463] Remove a resource', async ({ I, calendar }) => {
    await I.haveSetting({ 'io.ox/calendar': { viewView: 'week:week' } });
    const timestamp = Math.round(+new Date() / 1000);
    const name = `C7463 - ${timestamp}`;
    const mailaddress = `C7463${timestamp}@bla.de`;
    const resourceID = await I.haveResource({ description: name, display_name: name, name, mailaddress });
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: name,
        location: name,
        description: name,
        attendeePrivileges: 'DEFAULT',
        endDate:   { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') },
        startDate: { tzid: 'Europe/Berlin', value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        attendees: [{
            cuType: 'RESOURCE',
            comment: timestamp,
            cn: resourceID.display_name,
            email: mailaddress,
            entity: resourceID
        }]
    });
    const haloResourceLink = locate('.halo-resource-link').inside('.participant-list').withText(name);
    const participantName = locate('.participant-name').withText(name);
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label^="' + name + ', ' + name + '"]', 5);
    I.click('.appointment-container [aria-label^="' + name + ', ' + name + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForElement({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' }, 5);
    expect(await I.grabNumberOfVisibleElements(haloResourceLink)).to.equal(1);
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForElement(participantName);
    expect(await I.grabNumberOfVisibleElements(participantName)).to.equal(1);
    I.click(locate('.removable .remove').inside('.participant-wrapper').withText(name));
    expect(await I.grabNumberOfVisibleElements(participantName)).to.equal(0);
    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit.container', 5);
    I.waitForDetached(haloResourceLink);
    expect(await I.grabNumberOfVisibleElements(haloResourceLink)).to.equal(0);
    await I.dontHaveResource(name);
});
