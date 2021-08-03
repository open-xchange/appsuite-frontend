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

const expect = require('chai').expect,
    moment = require('moment'),
    _ = require('underscore');

Feature('Calendar');

Before(async ({ I, users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C274425] Month label in Calendar week view', async function ({ I, calendar }) {
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.retry(5).executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2019-05-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('April - May 2019 CW 18');
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-01-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('December 2019 - January 2020 CW 1');
});

Scenario('[C207509] Year view', async ({ I, calendar }) => {
    I.login(['app=io.ox/calendar&perspective=year']);
    calendar.waitForApp();
    // Expected Result: The year view displays each day of the year separated in month.
    I.waitNumberOfVisibleElements('.year-view .month-container', 12);
    let calenderWeeks = await I.grabTextFromAll('.year-view tbody td.cw');
    calenderWeeks.map(weekString => parseInt(weekString, 10));
    calenderWeeks = new Set(calenderWeeks);
    expect(calenderWeeks.size).to.be.within(52, 53);

    // Expected Result: No appointments are displayed in this view.
    I.dontSee('.appointment');

    // 3. Resize the browser window
    const sizesAndStyles = new Map([
        [400, 'width: 100%;'],
        [800, 'width: 50%;'],
        [1200, 'width: 33.3333%;'],
        [1400, 'width: 25%;'],
        [1800, 'width: 16.6667%;']
    ]);

    const resizeAndCheckStyle = (width, style) => {
        I.resizeWindow(width, 1000);
        I.seeNumberOfVisibleElements(`.year-view .month-container[style*="${style}"]`, 12);
    };

    // Expected Result: Layout switches between a one-, two-, four or six-columned view
    // TODO: actually there is also a three columned layout, need to verify this is correct
    sizesAndStyles.forEach((style, width) => resizeAndCheckStyle(width, style));

    // 4. Use the arrow icons at the top of the view to move between years.
    const actualYearString = await I.grabTextFrom('.year-view .info'),
        actualYear = parseInt(actualYearString, 10);

    const checkCorrectYear = async (addedYears) => {
        const yearString = await I.grabTextFrom('.year-view .info'),
            year = parseInt(yearString, 10);
        // Expected Result: Years will change accordingly
        expect(year).to.equal(actualYear + addedYears);
    };

    I.click('~Next year');
    await checkCorrectYear(1);

    I.click('~Previous year');
    I.click('~Previous year');
    await checkCorrectYear(-1);

    // reset year to the actual year
    I.click('~Next year');

    // 5. Click on the Year at the top of the view
    I.click(`${actualYear}`);

    // Expected Result: A year picker will open
    I.waitForVisible('.date-picker.open');
    I.see(`${Math.floor(actualYear / 10) * 10} - ${(Math.floor(actualYear / 10) * 10) + 12}`);

    // 6. Choose a year -20 and +20 years in the past and future from now and verify the week days on random days are correct
    const checkCorrectDays = async (addedYears) => {
        const startDay = moment().startOf('year').add(addedYears, 'years').format('d'),
            endDay = moment().endOf('year').add(addedYears, 'years').format('d'),
            daysLocator = locate('td')
                .after('.cw')
                .inside('.year-view-container'),
            { 0: firstWeek, length: l, [l - 1]: lastWeek } = _(await I.grabTextFromAll(daysLocator)).chunk(7);
        expect(`${firstWeek.indexOf('1')}`).to.equal(startDay);
        expect(`${lastWeek.indexOf('31')}`).to.equal(endDay);
    };

    I.click('~Go to next decade');
    I.click('~Go to next decade');
    I.click(`#year_${actualYear + 20}`, '.date-picker.open');
    await checkCorrectDays(20);

    I.click(`${actualYear + 20}`);
    I.click('~Go to previous decade');
    I.click('~Go to previous decade');
    I.click('~Go to previous decade');
    I.click('~Go to previous decade');
    I.click(`#year_${actualYear - 20}`, '.date-picker.open');
    await checkCorrectDays(-20);

    // 7. Click on any date
    // click the first 15th this will reliably open January
    I.click('15', '.year-view .month-container');

    // Expected Result: The respective month will be opened in month view
    I.waitForVisible('.monthview-container');
    I.see('January', '.monthview-container');
});

Scenario('[C236795] Visibility Flags', ({ I, calendar }) => {
    const createAppointment = (subject, startDate, startTime, visibility) => {
        I.clickToolbar('New appointment');
        I.waitForVisible('.io-ox-calendar-edit-window');
        I.retry(5).fillField('Subject', subject);
        calendar.setDate('startDate', startDate);
        I.click('~Start time');
        I.click(startTime);
        I.scrollTo('.io-ox-calendar-edit select');

        // PUBLIC => Standard
        // CONFIDENTIAL => Private
        // PRIVATE => Secret
        I.selectOption('.io-ox-calendar-edit select', visibility);

        // save
        I.click('Create', '.io-ox-calendar-edit-window');
        I.waitForDetached('.io-ox-calendar-edit-window', 5);
    };

    const getAppointmentLocator = function (subject, labelAndIcon) {
        const appointmentLocator = `.appointment div[title="${subject}"]`;
        if (!labelAndIcon) {
            return appointmentLocator;
        }
        const [label, iconClass] = labelAndIcon;
        return `${appointmentLocator} span[aria-label^="${label}"] i${iconClass}`;
    };

    const checkAppointment = (subject, visibility, time) => {
        createAppointment(subject, moment().startOf('week').add(1, 'days'), time, visibility);
        // PRIVATE => Private
        // CONFIDENTIAL => Secret
        let labelAndIcon;
        if (visibility === 'PRIVATE') labelAndIcon = ['Appointment is private', '.fa-user-circle'];
        else if (visibility === 'CONFIDENTIAL') labelAndIcon = ['Appointment is confidential', '.fa-lock'];
        // Expected Result: You created 3 appointsments with visivilities of Public, Private, Secret
        // Each visibility is displayed as in the example
        I.waitForVisible(getAppointmentLocator(subject, labelAndIcon));
    };

    I.login(['app=io.ox/calendar&perspective=week:week']);
    calendar.waitForApp();

    // 1. Create 3 appointments:
    // Set 1 of the 3 different visibilities to each appointment
    checkAppointment('Standard visibility', 'PUBLIC', '12:00 PM');
    checkAppointment('Private visibility', 'CONFIDENTIAL', '1:00 PM');
    checkAppointment('Secret visibility', 'PRIVATE', '2:00 PM');
});

Scenario('[C236832] Navigate by using the mini calendar in folder tree', async ({ I, calendar }) => {
    I.say('1. Sign in, switch to calendar');
    I.login(['app=io.ox/calendar&perspective=week:week']);
    calendar.waitForApp();

    // Expected Result: The current month switches as you click the "previous" or "next" month button
    I.say('2. Switch month by using the arrows of the mini calendar on the left');
    const currentMonth = moment().format('MMMM YYYY');
    const nextMonth = moment().add(1, 'month').format('MMMM YYYY');
    const previousMonth = moment().subtract(1, 'month').format('MMMM YYYY');

    I.see(currentMonth, '.window-sidepanel .date-picker');
    I.click('~Go to next month');
    I.see(nextMonth, '.window-sidepanel .date-picker');
    I.click('~Go to previous month');
    I.click('~Go to previous month');
    I.see(previousMonth, '.window-sidepanel .date-picker');

    I.say('3. Click the name of the current calendar month');
    const year = moment().subtract(1, 'month').format('YYYY'),
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    I.click(previousMonth, '.window-sidepanel .date-picker');
    I.seeElement(locate('span').withText(year).inside('.window-sidepanel .date-picker'));

    // Expected Result: The mini calendar show all 12 months
    months.forEach(month => I.see(`${month.slice(0, 3)}`, '.window-sidepanel .date-picker .grid'));

    I.say('4. Click the number of the current year');
    const minYear = Math.floor(year / 10) * 10;
    const maxYear = minYear + 12;
    const years = _.range(minYear, maxYear);
    I.click(year, '.window-sidepanel .date-picker');
    I.seeElement(locate('span').withText(`${minYear} - ${maxYear}`).inside('.window-sidepanel .date-picker'));

    // Expected Results: The mini calendar show all years from 2010-2021
    years.forEach(year => I.see(`${year}`, '.window-sidepanel .date-picker .grid'));

    // minyear + 8 is a bit more futureproof as hardcoded 2018
    I.say('5. Select "2018" as year');
    I.click(`#year_${minYear + 8}`, '.window-sidepanel .date-picker .grid');
    I.seeElement(locate('span').withText(`${minYear + 8}`).inside('.window-sidepanel .date-picker'));

    // All months are displayed of 2018 (as in step 3)
    months.forEach(month => I.see(`${month.slice(0, 3)}`, '.window-sidepanel .date-picker .grid'));

    I.say('6. Select a month');
    I.click(`#month_${minYear + 8}-07`, '.window-sidepanel .date-picker .grid');
    I.seeElement(locate('span').withText(`July ${minYear + 8}`).inside('.window-sidepanel .date-picker'));

    // Expected Result: The whole month is displayed
    const daysLocator = locate('td').after('.cw').inside('.window-sidepanel .date-picker .grid');
    const days = new Set(await I.grabTextFromAll(daysLocator));

    expect(days.size).to.equal(31);
    _.range(1, 32).forEach(day => expect(days.has(`${day}`)).to.be.true);

    // 7. Select a day
    const seventeenLocator = locate('td.date').withText('17').inside('.window-sidepanel .date-picker .grid .date');

    I.click(seventeenLocator);

    // Expected Result: The selected year, month and day is shown in the view on the right
    I.see(`July ${minYear + 8}`, '.weekview-container .info');
    I.see('17', '.weekview-container .weekview-toolbar .weekday');
});

Scenario('[C244785] Open event from invite notification in calendar', async ({ I, users, calendar }) => {
    const [userA, userB] = users;
    const startTime = moment().add(10, 'minutes');
    const endTime = moment().add(70, 'minutes');

    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });

    // 1. User#A: Create an appointment which starts in less than 15 minutes and invite User#B
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });
    calendar.waitForApp();
    calendar.newAppointment();
    I.fillField('Subject', 'Totally nerdy event');

    I.fillField(calendar.locators.starttime, startTime.format('hh:mm A'));
    I.fillField('Add contact/resource', userB.userdata.primaryEmail);
    I.wait(0.2);
    I.pressKey('Enter');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);
    I.logout();

    // 2. User#B: Login and go to any app except Calendar
    I.login(['app=io.ox/mail'], { user: userB });
    I.waitForVisible({ css: '.io-ox-mail-window' });

    // 3. User#B: Open the notification area from top bar
    I.waitForText('1', 30, '#io-ox-notifications-icon');
    I.click('1', '#io-ox-notifications-icon');
    I.waitForElement('#io-ox-notifications-icon.open');

    // Expected Result: Notification area contains an appointment invitation
    I.see('Appointment invitations');

    // 4. User#B: Click 'Open in calendar'
    I.click('Open in calendar');

    // Expected Result: Calendar opens containing a side popup with detailed appointment information.
    calendar.waitForApp();
    I.waitForText('Totally nerdy event', 5, '.appointment');
    I.seeElement('.io-ox-sidepopup');
    I.seeNumberOfElements('.calendar-detail.view', 1);
    I.see('Totally nerdy event', '.io-ox-sidepopup');
    I.see(`${startTime.format('ddd, M/D/YYYY')}`, '.io-ox-sidepopup .date');

    // Have to check since transition times are shown differently
    //isTransitionTime() ? I.see(`${startTime.format('h:mm')} ${startTime.format('A')} – ${endTime.format('h:mm')} ${endTime.format('A')}`) :
    I.see(`${startTime.format('h:mm')} – ${endTime.format('h:mm')} ${endTime.format('A')}`);

    //I.see(`${startTime.format('h:mm')} – ${endTime.format('h:mm')} ${startTime.format('A')}CEST`, '.io-ox-sidepopup .time');
    I.see(`${userA.userdata.sur_name}, ${userA.userdata.given_name}`, '.io-ox-sidepopup');
    I.see(`${userB.userdata.sur_name}, ${userB.userdata.given_name}`, '.io-ox-sidepopup');
});

Scenario('[C252158] All my public appointments', ({ I, users, calendar, dialogs }) => {
    const [userA, userB] = users;

    // 1. User#A: Login and go to Calendar
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    // 2. User#A: Create a public calendar (Cal#A)
    I.waitForText('Add new calendar');
    I.click('Add new calendar');
    I.clickDropdown('Personal calendar');
    dialogs.waitForVisible();
    I.waitForElement('input', 5, dialogs.locators.body);
    I.fillField('Calendar name', 'Cal#A');
    I.checkOption('Add as public calendar');
    I.click('Add');
    I.waitForVisible('#io-ox-core');

    // 3. User#A: Share the newly created calendar to all other users
    I.wait(1);
    I.click('.fa.fa-caret-right', '~Public calendars');
    I.selectFolder('Cal#A');
    I.waitForVisible({ css: 'a[title="Actions for Cal#A"]' });
    I.click({ css: 'a[title="Actions for Cal#A"]' });
    I.waitForText('Permissions');
    I.wait(1);
    I.click('Permissions');
    I.waitForVisible('.share-permissions-dialog');
    I.waitForFocus('.form-control.tt-input');
    I.fillField('.form-control.tt-input', userB.get('primaryEmail'));
    I.pressKey('Enter');
    I.click('Save');

    // 4. User#A: Create a new appointment in that calendar and invite User#B
    const subject = `${userA.userdata.name}s awesome appointment`;
    I.clickToolbar('New appointment');
    I.waitForText('Appointments in public calendar');
    I.click('Create in public calendar');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).fillField('Subject', subject);
    I.see('Cal#A', '.io-ox-calendar-edit-window .folder-selection');
    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKeys(moment().format('hh:mm'));
    I.pressKey('Enter');
    I.fillField('Add contact/resource', userB.userdata.primaryEmail);
    I.wait(0.5);
    I.pressKey('Enter');
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // 5. User#B: Login and go to Calendar
    I.logout();
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userB });
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    // 6. User#B: Enable "All my public appointments" view and disable Cal#A
    I.waitForVisible('~Public calendars');
    I.click('.fa.fa-caret-right', '~Public calendars');
    I.seeElement({ css: 'div[title="All my public appointments"] .color-label.selected' });
    I.dontSeeElement({ css: 'div[title="Cal#A"] .color-label.selected' });

    // Expected Result: The appointment from step 4 is shown
    I.waitForText(subject, 5, '.appointment');

    // 7. User#B: Enable "All my public appointments" view and enable Cal#A
    I.click('.color-label', { css: 'div[title="Cal#A"]' });
    I.seeElement({ css: 'div[title="Cal#A"] .color-label.selected' });

    // Expected Result: The appointment from step 4 is shown only once.
    I.waitForText(subject, 5, '.appointment');
    I.seeNumberOfElements(`.appointment[aria-label="${subject}"]`, 1);

    // 8. User#B: Disable "All my public appointments" view and enable Cal#A
    I.click('.color-label', { css: 'div[title="All my public appointments"]' });
    I.dontSeeElement({ css: 'div[title="All my public appointments"] .color-label.selected' });

    // Expected Result: The appointment from step 4 is shown
    I.waitForText(subject, 5, '.appointment');

    // 9. User#B: Disable "All my public appointments" view and disbale Cal#A
    I.click('.color-label', { css: 'div[title="Cal#A"]' });
    I.dontSeeElement({ css: 'div[title="Cal#A"] .color-label.selected' });

    // Expected Result: The appointment from step 4 is not shown
    I.seeNumberOfElements(`.appointment[aria-label="${subject}"]`, 0);
    I.dontSee(subject);
});

Scenario('[C265147] Appointment organizer should be marked in attendee list', async ({ I, calendar, users }) => {
    const [userA, userB] = users;

    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });

    // 1. Login as User#A
    // 2. Go to Calendar
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    // 3. Create new appointment
    const subject = `${userA.userdata.name}s awesome appointment`;
    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).fillField('Subject', subject);
    const startTime = moment().add(10, 'minutes');
    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKeys(startTime.format('hh:mm P'));
    I.pressKey('Enter');

    // 4. add User#B as participant
    I.fillField('Add contact/resource', userB.userdata.primaryEmail);
    I.wait(0.5);
    I.pressKey('Enter');
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);
    I.logout();

    // 5. Login with User#B
    // 6. Go to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userB });
    I.waitForVisible({ css: '.io-ox-calendar-window' });
    I.waitForVisible('.appointment');

    // 7. Open Appointment
    I.retry(5).click(subject, '.appointment');
    I.waitForElement('.calendar-detail.view');
    I.seeNumberOfElements('.calendar-detail.view', 1);

    // 8. Check if User#A is set as organizer
    I.see(subject, '.io-ox-sidepopup');
    I.see(`${userA.userdata.sur_name}, ${userA.userdata.given_name}`, '.io-ox-sidepopup');
    I.see(`${userB.userdata.sur_name}, ${userB.userdata.given_name}`, '.io-ox-sidepopup');

    // Expected Result: User#A is set as Organizer
    const organizerLocator = locate('li.participant')
        .withDescendant({ css: `a[title="${userA.userdata.primaryEmail}"]` })
        .withDescendant({ css: 'span.organizer-container' });
    I.seeElement(organizerLocator);
});

Scenario('[C274410] Subscribe shared Calendar and [C274410] Unsubscribe shared Calendar', async function ({ I, users, calendar, dialogs }) {
    const sharedCalendarName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: await calendar.defaultFolder() });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar&cap=caldav');
    calendar.waitForApp();

    I.waitForText('New calendar');
    I.rightClick({ css: '[aria-label^="New calendar"]' });
    I.waitForText('Share / Permissions');
    I.wait(0.2); // Just wait a little extra for all event listeners
    I.click('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForText('Permissions for calendar "New calendar"');
    I.fillField('.modal-dialog .tt-input', users[1].userdata.primaryEmail);
    I.waitForText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, undefined, '.tt-dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    dialogs.clickButton('Save');
    I.waitForDetached('.share-permissions-dialog .modal-dialog');

    I.logout();

    I.login('app=io.ox/calendar&cap=caldav', { user: users[1] });

    I.retry(5).doubleClick('~Shared calendars');
    I.waitForText(sharedCalendarName);

    I.retry(5).click('Add new calendar');

    I.click('Subscribe to shared calendar');

    dialogs.waitForVisible();
    I.waitForText('Subscribe to shared calendars');

    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find('.checkbox'));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForInvisible(locate('*').withText(sharedCalendarName));

    I.click('Add new calendar');
    I.click('Subscribe to shared calendar');

    dialogs.waitForVisible();
    I.waitForText('Subscribe to shared calendars');

    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find('.checkbox'));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'label' }).withText('Sync via DAV'));

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText(sharedCalendarName);
});

Scenario('Manage public Calendars', async function ({ I, users, calendar, dialogs }) {
    const publicCalendarName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New public`;

    I.login('app=io.ox/calendar&cap=caldav');
    calendar.waitForApp();
    // create public calendar
    I.say('Create public calendar');
    I.waitForText('Add new calendar', 5, '.folder-tree');
    I.click('Add new calendar', '.folder-tree');

    I.clickDropdown('Personal calendar');

    dialogs.waitForVisible();
    I.fillField('input[placeholder="New calendar"]', publicCalendarName);
    I.waitForText('Add as public calendar', 5, dialogs.locators.body);
    I.checkOption('Add as public calendar', dialogs.locators.body);
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('~Public calendars');
    I.click('.fa.fa-caret-right', '~Public calendars');

    I.waitForText(publicCalendarName);
    I.rightClick({ css: '[aria-label^="' + publicCalendarName + '"]' });
    I.wait(0.2);
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForElement('.form-control.tt-input', 5, dialogs.locators.header);

    await within('.modal-dialog', () => {
        I.waitForFocus('.tt-input');
        I.fillField('.tt-input[placeholder="Name or email address"]', 'All users');
        I.waitForVisible(locate('.tt-dropdown-menu').withText('All users'));
        I.pressKey('Enter');
        I.waitForVisible(locate('.permissions-view .row').withText('All users'));
    });

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.logout();

    I.login('app=io.ox/calendar&cap=caldav', { user: users[1] });

    I.retry(5).doubleClick('~Public calendars');
    I.waitForText(publicCalendarName);

    I.retry(5).click('Add new calendar');
    I.click('Subscribe to shared calendar');

    dialogs.waitForVisible();
    I.waitForText('Subscribe to shared calendars');

    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(publicCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(publicCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    I.logout();

    // cleanup
    I.login('app=io.ox/calendar&cap=caldav');
    calendar.waitForApp();

    // remove public calendar
    I.waitForText(publicCalendarName);
    I.rightClick({ css: '[aria-label^="' + publicCalendarName + '"]' });

    I.wait(0.2);
    I.clickDropdown('Delete');
    dialogs.waitForVisible();
    I.waitForElement('[data-action="delete"]', 5, dialogs.locators.body);
    dialogs.clickButton('Delete');
});

Scenario('Weeks with daylight saving changes are rendered correctly: Weekstart Sunday, change to daylight saving', async function ({ I, calendar }) {
    // see: OXUIB-146 Fix daylight saving issues
    const folder = await calendar.defaultFolder();

    await Promise.all([
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20200329T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20200329T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20200329T060000' },
            endDate:   { tzid: 'America/New_York', value: '20200329T070000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Monday 12-13 date without daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20200330T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20200330T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Monday 12-13 date without daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20200330T060000' },
            endDate:   { tzid: 'America/New_York', value: '20200330T070000' }
        })
    ]);

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    // jump to daylight saving change
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-03-29"))');

    // grab css
    I.waitForElement('.day:nth-child(2) .appointment');
    const topOfAppointment1 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(2) .appointment');

    I.waitForElement('.day:nth-child(2) .appointment');
    const topOfAppointment2 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(2) .appointment');

    I.waitForElement('.day:nth-child(3) .appointment');
    const topOfAppointment3 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(3) .appointment');

    I.waitForElement('.day:nth-child(3) .appointment');
    const topOfAppointment4 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(3) .appointment');

    // must be 50% because we set the appointments to 12 o clock
    expect(topOfAppointment1).to.equal('50%');
    expect(topOfAppointment2).to.equal('50%');
    expect(topOfAppointment3).to.equal('50%');
    expect(topOfAppointment4).to.equal('50%');
});

Scenario('Weeks with daylight saving changes are rendered correctly: Weekstart Sunday, change from daylight saving', async function ({ I, calendar }) {
    // see: OXUIB-146 Fix daylight saving issues
    const folder = await calendar.defaultFolder();

    await Promise.all([
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20201025T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20201025T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20201025T070000' },
            endDate:   { tzid: 'America/New_York', value: '20201025T080000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Monday 12-13 date without daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20201026T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20201026T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Monday 12-13 date without daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20201026T070000' },
            endDate:   { tzid: 'America/New_York', value: '20201026T080000' }
        })
    ]);

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    // jump to daylight saving change
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-10-25"))');

    // grab css
    I.waitForElement('.day:nth-child(2) .appointment');
    const topOfAppointment1 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(2) .appointment');

    I.waitForElement('.day:nth-child(2) .appointment');
    const topOfAppointment2 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(2) .appointment');

    I.waitForElement('.day:nth-child(3) .appointment');
    const topOfAppointment3 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(3) .appointment');

    I.waitForElement('.day:nth-child(3) .appointment');
    const topOfAppointment4 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(3) .appointment');

    // must be 50% because we set the appointments to 12 o clock
    expect(topOfAppointment1).to.equal('50%');
    expect(topOfAppointment2).to.equal('50%');
    expect(topOfAppointment3).to.equal('50%');
    expect(topOfAppointment4).to.equal('50%');
});

Scenario('Weeks with daylight saving changes are rendered correctly: Weekstart Monday, change to daylight saving', async function ({ I, calendar }) {
    // see: OXUIB-146 Fix daylight saving issues
    I.haveSetting('io.ox/core//localeData/firstDayOfWeek', 'monday');

    const folder = await calendar.defaultFolder();

    await Promise.all([
        I.haveAppointment({
            folder,
            summary: 'Saturday 12-13 date without daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20200328T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20200328T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Saturday 12-13 date without daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20200328T070000' },
            endDate:   { tzid: 'America/New_York', value: '20200328T080000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20200329T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20200329T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20200329T060000' },
            endDate:   { tzid: 'America/New_York', value: '20200329T070000' }
        })
    ]);

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    // jump to daylight saving change
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-03-23"))');

    // grab css
    I.waitForElement('.day:nth-child(7) .appointment');
    const topOfAppointment1 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(7) .appointment');

    I.waitForElement('.day:nth-child(7) .appointment');
    const topOfAppointment2 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(7) .appointment');

    I.waitForElement('.day:nth-child(8) .appointment');
    const topOfAppointment3 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(8) .appointment');

    I.waitForElement('.day:nth-child(8) .appointment');
    const topOfAppointment4 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(8) .appointment');

    // must be 50% because we set the appointments to 12 o clock
    expect(topOfAppointment1).to.equal('50%');
    expect(topOfAppointment2).to.equal('50%');
    expect(topOfAppointment3).to.equal('50%');
    expect(topOfAppointment4).to.equal('50%');
});

Scenario('Weeks with daylight saving changes are rendered correctly: Weekstart Monday, change from daylight saving', async function ({ I, calendar }) {
    // see: OXUIB-146 Fix daylight saving issues
    I.haveSetting('io.ox/core//localeData/firstDayOfWeek', 'monday');

    const folder = await calendar.defaultFolder();

    await Promise.all([
        I.haveAppointment({
            folder,
            summary: 'Saturday 12-13 date without daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20201024T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20201024T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Saturday 12-13 date without daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20201024T060000' },
            endDate:   { tzid: 'America/New_York', value: '20201024T070000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'Europe/Berlin', value: '20201025T120000' },
            endDate:   { tzid: 'Europe/Berlin', value: '20201025T130000' }
        }),
        I.haveAppointment({
            folder,
            summary: 'Sunday 12-13 date with daylight saving change',
            startDate: { tzid: 'America/New_York', value: '20201025T070000' },
            endDate:   { tzid: 'America/New_York', value: '20201025T080000' }
        })
    ]);

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    // jump to daylight saving change
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-10-19"))');

    // grab css
    I.waitForElement('.day:nth-child(7) .appointment');
    const topOfAppointment1 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(7) .appointment');

    I.waitForElement('.day:nth-child(7) .appointment');
    const topOfAppointment2 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(7) .appointment');

    I.waitForElement('.day:nth-child(8) .appointment');
    const topOfAppointment3 = await I.executeScript(el => $(el).get(0).style.top, '.day:nth-child(8) .appointment');

    I.waitForElement('.day:nth-child(8) .appointment');
    const topOfAppointment4 = await I.executeScript(el => $(el).get(1).style.top, '.day:nth-child(8) .appointment');

    // must be 50% because we set the appointments to 12 o clock
    expect(topOfAppointment1).to.equal('50%');
    expect(topOfAppointment2).to.equal('50%');
    expect(topOfAppointment3).to.equal('50%');
    expect(topOfAppointment4).to.equal('50%');
});

Scenario('[C85743] Special-Use flags', async function ({ I, dialogs }) {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');
    I.waitForText('Edit');
    I.retry(10).click('Edit');
    dialogs.waitForVisible();
    I.scrollTo('#sent_fullname');
    I.seeInField('#sent_fullname', 'INBOX/Sent');
    I.dontSeeInField('#sent_fullname', 'INBOX/Sent Items');  // Default if no special use folder exists on imap (AdminUser.properties:SENT_MAILFOLDER_EN_US)
    I.dontSeeInField('#sent_fullname', 'INBOX/Sent Messages');
});

Scenario('[C274517] Download multiple attachments (as ZIP)', async function ({ I, calendar }) {
    I.handleDownloads('../../build/e2e');
    const folder = await calendar.defaultFolder();
    const subject = 'Meetup XY';
    const appointment = await I.haveAppointment({
        folder,
        summary: subject,
        startDate: { tzid: 'Europe/Berlin', value: moment().set('hour', 13).format('YYYYMMDD[T]HHmmss') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().set('hour', 14).format('YYYYMMDD[T]HHmmss') }
    });
    let updatedAppointment = await I.haveAttachment('calendar', appointment, 'e2e/media/files/generic/testdocument.odt');
    updatedAppointment = await I.haveAttachment('calendar', updatedAppointment, 'e2e/media/files/generic/testdocument.rtf');
    await I.haveAttachment('calendar', updatedAppointment, 'e2e/media/files/generic/testspreadsheed.xlsm');

    I.login('app=io.ox/calendar&perspective=week:week');

    I.waitForText(subject);
    I.click(subject);

    I.waitForText('Attachments');
    I.waitForText('testdocument.odt');
    I.waitForText('testdocument.rtf');
    I.waitForText('testspreadsheed.xlsm');
    I.waitForText('All attachments');

    I.click('All attachments');
    I.waitForText('Download');
    I.waitForText('Save to Drive');
    I.seeNumberOfElements('.dropdown.open a[role="menuitem"]', 2);

    I.click('Download', '.dropdown.open');

    I.amInPath('/build/e2e/');
    I.waitForFile('attachments.zip', 5);
});
