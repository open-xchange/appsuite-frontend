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

Scenario('[C7449] Move appointment to folder', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  defaultFolderId,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar');

    if (!moment().isSame(time, 'month')) I.retry(5).click('~Go to next month', '.window-sidepanel');
    I.retry(5).click(`~${time.format('l, dddd')}, CW ${time.week()}`, '.window-sidepanel');

    // open all views and load the appointment there
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
    });

    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup');

    I.waitForVisible(locate('~More actions').inside('.io-ox-sidepopup'));
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Move');

    I.waitForVisible('.modal-dialog');
    within('.modal-dialog', function () {
        I.click('.folder-arrow', '~My calendars');
        I.waitForVisible({ css: '[title="New calendar"]' });
        I.click({ css: '[title="New calendar"]' });
        I.wait(0.5); // wait until disabled is removed
        I.click('Move');
    });
    I.waitForDetached('.modal-dialog');

    // disable the other folder
    I.wait(1);
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });
    I.click({ css: '[title="New calendar"] .color-label' });
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="false"]' });

    // open all views and verify that the appointment is gone
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForInvisible('.page.current .appointment');
        I.dontSee('Testappointment');
    });

    // enable the other folder
    I.click({ css: '[title="New calendar"] .color-label' });
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });

    // open all views and verify that the appointment is there again
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
    });
});

Scenario('[C7450] Edit private appointment', async function (I) {
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        class: 'CONFIDENTIAL'
    });

    I.login('app=io.ox/calendar');

    if (!moment().isSame(time, 'month')) I.retry(5).click('~Go to next month', '.window-sidepanel');
    I.retry(5).click(`~${time.format('l, dddd')}, CW ${time.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
        I.seeElement('.fa-lock', '~Testappointment');
    });

    // edit the appointment
    I.doubleClick('.page.current .appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.selectOption('Visibility', 'Standard');

    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');

    // Check all views
    ['Workweek', 'Day', 'Month', 'List', 'Week'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForElement('.page.current .appointment');
        I.see('Testappointment');
        I.waitForInvisible(locate('.fa-lock').inside('~Testappointment').inside('.page.current'));
    });

});

Scenario('[C7451] Edit yearly series via dubbleclick', async function (I) {
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment('1612', 'DDMM').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        rrule: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=16'
    });

    I.login('app=io.ox/calendar');
    I.waitForElement('~Go to next month');

    // select the next 16.th december via the mini calendar
    const diffMonth = time.diff(moment().startOf('month'), 'months');
    for (let i = 0; i < diffMonth; i++) I.click('~Go to next month', '.window-sidepanel');
    I.click(`~${time.format('l, dddd')}, CW ${time.week()}`, '.window-sidepanel');

    I.clickToolbar('View');
    I.click('Week');

    I.waitForVisible(`.page.current .day:nth-child(${time.weekday() + 2}) .appointment`);
    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup .inline-toolbar-container');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('~Date (M/D/YYYY)');
    I.waitForVisible('.date-picker.open', 2);
    I.pressKey(['Control', 'a']);
    I.pressKey(time.add(1, 'day').format('l'));
    I.pressKey('Enter');

    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.waitForVisible(`.page.current .day:nth-child(${time.weekday() + 2}) .appointment`);

    time.add(1, 'year');
    for (let i = 0; i < 12; i++) I.click('~Go to next month', '.window-sidepanel');
    I.click(`~${time.format('l, dddd')}, CW ${time.week()}`, '.window-sidepanel');

    I.waitForVisible(`.page.current .day:nth-child(${time.weekday() + 2}) .appointment`);
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
});

Scenario('[C7465] Edit appointment in shared folder as author', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const folder = await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar');

    I.waitForText('New calendar');
    I.rightClick({ css: '[aria-label^="New calendar"]' });
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
        I.waitForText('Changedappointment', 5, '.calendar-detail');
        I.see('Changedlocation');
        I.see('Changeddescription');
    });
});

Scenario('[C234659] Split appointment series', async function (I, users) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    I.login('app=io.ox/calendar');

    I.clickToolbar('New appointment');
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
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup .inline-toolbar-container');

    I.click('Edit');
    I.waitForText('Do you want to edit this and all future appointments or just this appointment within the series?');
    I.click('Edit all future appointments');

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

    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.see(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, '.io-ox-sidepopup');
});

Scenario('[C234679] Exceptions changes on series modification', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    I.login('app=io.ox/calendar');

    I.clickToolbar('New appointment');
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
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');

    I.waitForText('Edit', undefined, '.io-ox-sidepopup');
    I.click('Edit');
    I.waitForText('Do you want to edit this and all future appointments or just this appointment within the series?');
    I.click('Edit this appointment');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('~Start time');
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

    I.fillField('Subject', 'Changedsubject');

    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForText('Changedsubject', undefined, '.io-ox-sidepopup');
    I.click('~Close', '.io-ox-sidepopup');

    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Changedsubject', undefined, '.io-ox-sidepopup');

});

Scenario('[C7467] Delete recurring appointment in shared folder as author', async function (I, users) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const folder = await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
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

Scenario('[C7470] Delete a recurring appointment', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const folder = await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });
    const time = moment().startOf('week').add(1, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
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

    I.waitForText('Do you want to delete all appointments of the series or just this appointment?');
    I.click('Delete all appointments');

    I.waitForDetached('.io-ox-sidepopup');

    I.waitForInvisible(locate('.appointment').inside('.page.current'));
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.dontSee('.appointment', '.page.current');
    });
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

    I.waitForText('Details');
    I.click('Details');
    I.waitForText(`Organizer ${users[1].userdata.display_name}`, undefined, '.io-ox-sidepopup');
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
    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Details');
    I.see(`Organizer ${users[0].userdata.display_name}`, '.io-ox-sidepopup');

    I.wait(0.2); // gently wait for event listeners
    I.click('~More actions', '.io-ox-sidepopup');
    I.click('Change organizer');

    I.waitForText('Do you want to edit this and all future appointments or the whole series?');
    I.click('Edit all future appointments');

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

    I.click({ xpath: '(//div[@class="appointment-content"])[2]' });
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
    I.waitForVisible('.appointment');
    I.click('Appointment1', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Do you really want to delete this appointment?');
    I.click('Delete appointment', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete recurring appointment without additional participants => no comment field
    I.click('Appointment2', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Do you want to delete all appointments of the series or just this appointment?');
    I.click('Delete all appointments', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete single appointment with additional participants => comment field
    I.click('Appointment3', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Delete appointment');
    I.see('Add a message to the notification email for the other participants.');
    I.click('Delete appointment', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // Delete recurring appointment with additional participants => comment field
    I.click('Appointment4', '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.retry(5).click('Delete');
    I.waitForText('Delete appointment');
    I.see('Add a message to the notification email for the other participants.');
    I.click('Delete all appointments', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

});

Scenario('[C7452] Edit weekly recurring appointment via Drag&Drop', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    // recurring appointment without additional participants
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testappointment',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        rrule: 'FREQ=WEEKLY;BYDAY=MO;INTERVAL=2;COUNT=3'
    });

    I.login('app=io.ox/calendar');

    I.waitForText('Testappointment');
    I.see('Testappointment', locate('.page.current .day').at(1));
    I.dragAndDrop('.page.current .appointment', locate('.page.current .day').at(2).find('.timeslot').at(21));
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForInvisible('.page.current .appointment.io-ox-busy');
    I.see('Testappointment', locate('.page.current .day').at(2));

    I.clickToolbar('View');
    I.click('Week');

    I.waitForVisible('.appointment');
    I.see('Testappointment', locate('.page.current .day').at(3));

    // use 5th child here as the container has another child before the first .day
    I.dragAndDrop(locate('.page.current .appointment'), locate('.page.current .day').at(4).find('.timeslot').at(21));
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForInvisible('.page.current .appointment.io-ox-busy');
    I.see('Testappointment', locate('.page.current .day').at(4));

    I.clickToolbar('View');
    I.click('Month');

    I.waitForVisible('.page.current .appointment');
    time.add(2, 'days');
    I.see('Testappointment', { css: `[id="${time.format('YYYY-M-D')}"]` });

    time.add(1, 'day');
    I.dragAndDrop(locate('.page.current .appointment'), `[id="${time.format('YYYY-M-D')}"]`);
    I.waitForText('Do you want to edit the whole series or just this appointment within the series?');
    I.click('Edit series');

    I.waitForInvisible('.page.current .appointment.io-ox-busy');
    I.see('Testappointment', { css: `[id="${time.format('YYYY-M-D')}"]` });
});

Scenario('[C7453] Edit appointment, set the all day checkmark', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, 'chronos/allowChangeOfOrganizer': true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testsubject',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });
    const appointment = locate('.page.current .appointment-container .appointment')
        .withText('Testsubject')
        .as('Test appointment container');

    I.login('app=io.ox/calendar');
    I.waitForElement(appointment);

    I.doubleClick(appointment);
    I.waitForElement('.io-ox-calendar-edit-window');
    I.waitForText('All day');
    I.checkOption('All day');
    I.click('Save');

    I.waitForInvisible(appointment);
    I.waitForVisible(locate('.page.current .fulltime-container .appointment').withText('Testsubject'));

});

Scenario('[C7457] Edit appointment via toolbar', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, 'chronos/allowChangeOfOrganizer': true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(8, 'days').add(10, 'hours');
    await I.haveAppointment({
        folder:  folder,
        summary: 'Testsubject',
        location: 'Testlocation',
        description: 'Testdescription',
        startDate: { value: time.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar');

    // select the according day in the mini datepicker
    if (!moment().isSame(time, 'month')) I.retry(5).click('~Go to next month', '.window-sidepanel');
    I.retry(5).click(`~${time.format('l, dddd')}, CW ${time.week()}`, '.window-sidepanel');

    // open all views and load the appointment there
    ['Day', 'Month', 'List', 'Week', 'Workweek'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible(locate('*').withText('Testsubject').inside('.page.current'));
    });

    I.click('.appointment', '.page.current');
    I.retry(5).click('Edit');

    I.retry(5).fillField('Subject', 'Newsubject');
    I.fillField('Location', 'Newlocation');
    I.fillField('Description', 'Newdescription');
    I.click('Save');

    // open all views and check the appointment there
    ['Day', 'Month', 'List', 'Week', 'Workweek'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);

        I.retry(5).click('.appointment', '.page.current');
        I.retry(5).see('Newsubject', '.calendar-detail');
        I.see('Newlocation', '.calendar-detail');
        I.see('Newdescription', '.calendar-detail');
        if (view !== 'List') I.click('~Close', '.io-ox-sidepopup');
    });
});

Scenario('[C7454] Edit appointment, all-day to one hour', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);

    const momentRange = require('moment-range').extendMoment(moment);
    const testrailID = 'C7454';
    const appointmentSelector = { css: `[title="${testrailID}, ${testrailID}"]` };
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: momentRange().format('YYYYMMDD')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: momentRange().format('YYYYMMDD')
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

    I.login('app=io.ox/calendar&perspective=week:week');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
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
    I.click(appointmentSelector);
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForText('12:00 – 1:00 PM');
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
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
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
    I.dontSeeElement('.io-ox-sidepopup-pane a[title="' + users[1].userdata.primaryEmail + '"]');
});

Scenario('[C7461] Add a participant/ressource', async function (I, users) {
    await users.create();
    await users.create();
    const [userA, userB, weebl, bob] = users;

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true, separateExternalParticipantList: true }
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
    I.waitForText(subject, 5, '.appointment');

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
    ].forEach(mail => I.waitForText(mail, 5, '.participant-wrapper'));

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
            I.waitForVisible('.calendar-detail-pane');
            I.see(subject, '.calendar-detail-pane');
        } else {
            I.waitForVisible('.io-ox-sidepopup');
            I.see(subject, '.io-ox-sidepopup');
        }
        I.seeElement({ css: 'a[aria-label="unconfirmed 4"]' });
        I.seeElement({ css: 'a[aria-label="accepted 1"]' });
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

    I.click('#io-ox-refresh-icon');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.retry().waitForElement({ css: `span[title="New appointment: ${subject}"]` });

    // clean up groups and resources
    await I.dontHaveResource(resourceName);
    await I.dontHaveGroup(groupName);
});

Scenario('[C7455] Edit appointment by changing the timeframe', async function (I, users) {

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] }),
        summary = 'Dinner for one';
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
    I.wait(0.5);

    I.click(summary, '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('11:00 – 1:00 PM');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');
    I.dragAndDrop('.appointment .resizable-s', '.day .timeslot:nth-child(28)');
    I.wait(0.5);

    I.click(summary, '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('11:00 – 2:00 PM');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');

    I.clickToolbar('View');
    I.click('Week', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('11:00 – 2:00 PM');

    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('11:00 – 2:00 PM');

    I.clickToolbar('View');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);

    I.waitForText('11:00 AM');
    I.waitForText('2:00 PM');
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
    I.waitForElement(locate('.appointment').withText(subject));

    // 2. Select the existing appointment, click "Edit"
    I.click(subject, '.appointment');
    I.waitForText('Edit', undefined, '.io-ox-sidepopup');
    I.click('Edit');

    // Expected Result: The appointment edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');

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
    const summary = 'Brexit';
    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: summary,
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

    I.waitForElement('.appointment');
    // have to scroll appointment into view for drag & drop to work
    I.executeScript(function () {
        // select first appointment element
        $('.appointment-content')[0].scrollIntoView(true);
    });
    I.dragAndDrop('.appointment .appointment-content', '.day .timeslot:nth-child(27)');
    I.wait(0.5);

    I.click(summary, '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('1:00 – 2:00 PM');

    I.clickToolbar('View');
    I.click('Week', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('1:00 – 2:00 PM');

    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');

    I.click('.io-ox-pagecontroller.current .appointment');
    I.waitForText('1:00 – 2:00 PM');

    I.clickToolbar('View');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);

    I.waitForText('1:00 PM');
    I.waitForText('2:00 PM');
});

Scenario('[C7459] Remove attachments', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true }
    });

    // Precondition: An appointment with file attachment exists
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`,
        startTime = moment().add(1, 'hour'),
        endTime = moment().add(2, 'hour'),
        subject = `Allhands ${startTime.format('h A')} Meeting`,
        appointment = await I.haveAppointment({
            folder:  folder,
            summary: subject,
            startDate: { value: startTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
            endDate: { value: endTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
        }),
        updatedAppointment = await I.haveAttachment('calendar', appointment, 'e2e/media/files/generic/testdocument.odt');
    await I.haveAttachment('calendar', updatedAppointment, 'e2e/media/files/generic/testdocument.rtf');

    // 1. Switch to Calendar
    I.login('app=io.ox/calendar&perspective=week:week');

    // Expected Result: The calendar app shows up, including the existing appointment
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.waitForVisible('.appointment');
    I.see(subject, '.appointment');

    // 2. Select the existing appointment, click "Edit"
    I.click(subject, '.appointment');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Edit');
    I.click('Edit');

    // Expected Result: The edit dialog is shown
    I.waitForVisible('.io-ox-calendar-edit-window');

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
        I.waitForText(subject, 5, context);
        I.dontSee('testdocument.odt', context);
        I.dontSee('testdocument.rtf', context);
    };
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForText(subject, 5, '.page.current .appointment');
        I.click(subject, '.page.current .appointment');
        if (view === 'List') {
            dontSeeAttachments('.calendar-detail-pane');
        } else {
            dontSeeAttachments('.io-ox-sidepopup');
        }
    });
});

// Bug: Double-clicking causes appointment to open and close again
Scenario('[C7458] Edit appointment by doubleclick @bug', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, notifyNewModifiedDeleted: true }
    });

    // You already had created a non all-day appointment
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`,
        startTime = moment().add(1, 'hour'),
        endTime = moment().add(2, 'hour'),
        subject = `Mr. Torques ${startTime.format('h a')} explosions`;
    await I.haveAppointment({
        folder:  folder,
        summary: subject,
        startDate: { value: startTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' },
        endDate: { value: endTime.format('YYYYMMDD[T]HHmmss'), tzid: 'Europe/Berlin' }
    });

    // 1. Double click to an appointment
    I.login(['app=io.ox/calendar&perspective=week:week']);
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.waitForText(subject, 5, '.appointment');
    I.doubleClick(subject, '.appointment');

    // Expected Result: Edit tab is opened.
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 2. Change Subject, Location and Description.
    const explosions = 'EXPLOSIONS',
        explosionSubject = `${explosions} at ${startTime.format('h a')}`,
        description = `Lorem ${explosions} sit dolor!`;
    I.fillField('Subject', explosionSubject);
    I.fillField('Location', 'Pandora');
    I.fillField('Description', description);

    // 3. Click "Save"
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // 4. Check this appointment in all views.
    // Expected Result: The appointment has been changed successfully.
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
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

Scenario('[C7463] Remove a resource', async function (I, users) {
    var timestamp = Math.round(+new Date() / 1000);
    let testrailID = 'C7463';
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    const resource = {
        description: timestamp,
        display_name: timestamp,
        name: timestamp,
        mailaddress: timestamp + '@bla.de'
    };
    const resourceID = await I.haveResource(resource, { user: users[0] });
    await I.haveAppointment({
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
                cuType: 'RESOURCE',
                comment: resource.description,
                cn: resourceID.display_name,
                email: resource.mailaddress,
                entity: resourceID
            }
        ]
    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label^="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [aria-label^="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForElement({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' }, 5);
    expect(await I.grabNumberOfVisibleElements(locate('.halo-resource-link').inside('.participant-list').withText(JSON.stringify(resource.display_name)))).to.equal(1);
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForElement(locate('.participant-name').withText(JSON.stringify(resource.display_name)));
    expect(await I.grabNumberOfVisibleElements(locate('.participant-name').withText(JSON.stringify(resource.display_name)))).to.equal(1);
    I.click(locate('.removable .remove').inside('.participant-wrapper').withText(JSON.stringify(resource.display_name)));
    expect(await I.grabNumberOfVisibleElements(locate('.participant-name').withText(JSON.stringify(resource.display_name)))).to.equal(0);
    I.click('Save');
    I.waitForDetached('.io-ox-calendar-edit.container', 5);
    expect(await I.grabNumberOfVisibleElements(locate('.halo-resource-link').inside('.participant-list').withText(JSON.stringify(resource.display_name)))).to.equal(0);
    await I.dontHaveResource(resource.name, { user: users[0] });
});
