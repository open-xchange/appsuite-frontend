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
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */


/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect,
    moment = require('moment'),
    _ = require('underscore');

Feature('Calendar');

Before(async (users) => {
    await users.create();
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C274425] Month label in Calendar week view', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.retry(5).executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2019-05-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('April - May 2019 CW 18');
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-01-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('December 2019 - January 2020 CW 1');
});

Scenario('[C207509] Year view', async (I) => {
    // 1. Go to Calendar
    I.login(['app=io.ox/calendar']);
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // 2. Switch to year view (View -> Year)
    I.clickToolbar('View');
    I.click('Year');

    // Expected Result: Year view opens.
    I.seeElement('.year-view');

    // Expected Result: The year view displays each day of the year separated in month.
    I.seeNumberOfElements('.year-view .month-container', 12);
    let calenderWeeks = await I.grabTextFrom('.year-view tbody td.cw');
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

    const resizeAndCheckStyle = async (width, style) => {
        I.resizeWindow(width, 1000);
        const styles = await I.grabAttributeFrom('.year-view .month-container', 'style');
        styles.forEach(css => expect(css).to.include(style));
    };

    // Expected Result: Layout switches between a one-, two-, four or six-columned view
    // TODO: actually there is also a three columned layout, need to verify this is correct
    sizesAndStyles.forEach(async (style, width) => await resizeAndCheckStyle(width, style));

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
            { 0: firstWeek, length: l, [l - 1]: lastWeek } = _(await I.grabTextFrom(daysLocator)).chunk(7);
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

Scenario.skip('[C236795] Visibility Flags', (I, calendar) => {
    const createAppointment = (subject, startDate, startTime, visibility) => {
        I.clickToolbar('New appointment');
        I.waitForVisible('.io-ox-calendar-edit-window');
        I.fillField('Subject', subject);
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
        return `${appointmentLocator} span[title="${label}"] i${iconClass}`;
    };

    const checkAppointment = (subject, visibility, time) => {
        createAppointment(subject, moment().startOf('isoWeek'), time, visibility);
        // PRIVATE => Private
        // CONFIDENTIAL => Secret
        let labelAndIcon;
        if (visibility === 'PRIVATE') {
            labelAndIcon = ['Private', '.fa-user-circle'];
        } else if (visibility === 'CONFIDENTIAL') labelAndIcon = ['Confidential', '.fa-lock'];

        // Expected Result: You created 3 appointsments with visivilities of Public, Private, Secret
        // Each visibility is displayed as in the example
        I.waitForVisible(getAppointmentLocator(subject, labelAndIcon));
    };

    I.login(['app=io.ox/calendar&perspective=week:week']);
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // 1. Create 3 appointments:
    // Set 1 of the 3 different visibilities to each appointment
    checkAppointment('Standard visibility', 'PUBLIC', '12:00 PM');
    checkAppointment('Private visibility', 'CONFIDENTIAL', '1:00 PM');
    checkAppointment('Secret visibility', 'PRIVATE', '2:00 PM');
});

Scenario('[C236832] Navigate by using the mini calendar in folder tree', async (I) => {
    // 1. Sign in, switch to calendar
    I.login(['app=io.ox/calendar&perspective=week:week']);
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.waitForElement('.window-sidepanel .date-picker');

    // 2. Switch month by using the arrows of the mini calendar on the left (located inside the folder tree)
    // Expected Result: The current month switches as you click the "previous" or "next" month button
    const currentMonth = moment().format('MMMM YYYY'),
        nextMonth = moment().add(1, 'month').format('MMMM YYYY'),
        previousMonth = moment().subtract(1, 'month').format('MMMM YYYY');

    I.see(currentMonth, '.window-sidepanel .date-picker');
    I.click('~Go to next month');
    I.see(nextMonth, '.window-sidepanel .date-picker');
    I.click('~Go to previous month');
    I.click('~Go to previous month');
    I.see(previousMonth, '.window-sidepanel .date-picker');

    // 3. Click the name of the current calendar month
    const currentYear = moment().format('YYYY'),
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    I.click(previousMonth, '.window-sidepanel .date-picker');
    I.seeElement(locate('span').withText(currentYear).inside('.window-sidepanel .date-picker'));

    // Expected Result: The mini calendar show all 12 months
    months.forEach(month => I.see(`${month.slice(0, 3)}`, '.window-sidepanel .date-picker .grid'));

    // 4. Click the number of the current year
    const minYear = Math.floor(currentYear / 10) * 10,
        maxYear = minYear + 12,
        years = _.range(minYear, maxYear);

    I.click(currentYear, '.window-sidepanel .date-picker');
    I.seeElement(locate('span').withText(`${minYear} - ${maxYear}`).inside('.window-sidepanel .date-picker'));

    // Expected Results: The mini calendar show all years from 2010-2021
    years.forEach(year => I.see(`${year}`, '.window-sidepanel .date-picker .grid'));

    // 5. Select "2018" as year
    // minyear + 8 is a bit more futureproof as hardcoded 2018
    I.click(`#year_${minYear + 8}`, '.window-sidepanel .date-picker .grid');
    I.seeElement(locate('span').withText(`${minYear + 8}`).inside('.window-sidepanel .date-picker'));

    // All months are displayed of 2018 (as in step 3)
    months.forEach(month => I.see(`${month.slice(0, 3)}`, '.window-sidepanel .date-picker .grid'));

    // 6. Select a month
    I.click(`#month_${minYear + 8}-07`, '.window-sidepanel .date-picker .grid');
    I.seeElement(locate('span').withText(`July ${minYear + 8}`).inside('.window-sidepanel .date-picker'));

    // Expected Result: The whole month is displayed
    const daysLocator = locate('td').after('.cw').inside('.window-sidepanel .date-picker .grid'),
        days = new Set(await I.grabTextFrom(daysLocator));

    expect(days.size).to.equal(31);
    _.range(1, 32).forEach(day => expect(days.has(`${day}`)).to.be.true);

    // 7. Select a day
    const seventeenLocator = locate('td.date').withText('17').inside('.window-sidepanel .date-picker .grid .date');

    I.click(seventeenLocator);

    // Expected Result: The selected year, month and day is shown in the view on the right
    I.see(`July ${minYear + 8}`, '.weekview-container .info');
    I.see('17', '.weekview-container .weekview-toolbar .weekday');
});

//TODO: step I see "11:21 AM – 12:21 PM" fails, seems to only happen at around 11am - 12 pm
Scenario.skip('[C244785] Open event from invite notification in calendar', async (I, users) => {
    const [userA, userB] = users;

    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });

    // 1. User#A: Create an appointment which starts in less than 15 minutes and invite User#B
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.fillField('Subject', 'Totally nerdy event');

    const startTime = moment().add(10, 'minutes'),
        endTime = moment().add(70, 'minutes');

    // check if start and end time is transitioning between am/pm
    const isTransitionTime = function () {
        return startTime.format('A') !== endTime.format('A');
    };

    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKey(startTime.format('hh:mm A'));
    I.pressKey('Enter');
    I.fillField('Add contact/resource', userB.userdata.primaryEmail);
    I.wait(0.5);
    I.pressKey('Enter');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);
    I.logout();

    // 2. User#B: Login and go to any app except Calendar
    I.login(['app=io.ox/mail'], { user: userB });
    I.waitForVisible({ css: '*[data-app-name="io.ox/mail"]' });

    // 3. User#B: Open the notification area from top bar
    I.waitForText('1', 10, '#io-ox-notifications-icon');
    I.click('1', '#io-ox-notifications-icon');
    I.waitForElement('#io-ox-notifications-icon.open');

    // Expected Result: Notification area contains an appointment invitation
    I.see('Appointment invitations');

    // 4. User#B: Click 'Open in calendar'
    I.click('Open in calendar');

    // Expected Result: Calendar opens containing a side popup with detailed appointment information.
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
    I.waitForText('Totally nerdy event', 5, '.appointment');
    I.seeElement('.io-ox-sidepopup');
    I.seeNumberOfElements('.calendar-detail.view', 1);
    I.see('Totally nerdy event', '.io-ox-sidepopup');
    I.see(`${startTime.format('ddd, M/D/YYYY')}`, '.io-ox-sidepopup .date');

    // Have to check since transition times are shown differently
    isTransitionTime() ? I.see(`${startTime.format('h:mm')} ${startTime.format('A')} – ${endTime.format('h:mm')} ${endTime.format('A')}`) :
        I.see(`${startTime.format('h:mm')} – ${endTime.format('h:mm')} ${startTime.format('A')}`);

    //I.see(`${startTime.format('h:mm')} – ${endTime.format('h:mm')} ${startTime.format('A')}CEST`, '.io-ox-sidepopup .time');
    I.see(`${userA.userdata.sur_name}, ${userA.userdata.given_name}`, '.io-ox-sidepopup');
    I.see(`${userB.userdata.sur_name}, ${userB.userdata.given_name}`, '.io-ox-sidepopup');
});

Scenario('[C252158] All my public appointments', (I, users) => {
    const [userA, userB] = users;

    // 1. User#A: Login and go to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // 2. User#A: Create a public calendar (Cal#A)
    I.waitForText('Add new calendar');
    I.click('Add new calendar');
    I.waitForText('Personal calendar');
    I.click('Personal calendar');
    I.waitForVisible('.modal-body');
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
    I.fillField('Subject', subject);
    I.see('Cal#A', '.io-ox-calendar-edit-window .folder-selection');
    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().format('hh:mm'));
    I.pressKey('Enter');
    I.fillField('Add contact/resource', userB.userdata.primaryEmail);
    I.wait(0.5);
    I.pressKey('Enter');
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // 5. User#B: Login and go to Calendar
    I.logout();
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userB });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

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

Scenario('[C265147] Appointment organizer should be marked in attendee list', async (I, users) => {
    const [userA, userB] = users;

    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });

    // 1. Login as User#A
    // 2. Go to Calendar
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // 3. Create new appointment
    const subject = `${userA.userdata.name}s awesome appointment`;
    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.fillField('Subject', subject);
    const startTime = moment().add(10, 'minutes');
    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKey(startTime.format('hh:mm P'));
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
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });
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

Scenario('[C274410] Subscribe shared Calendar and [C274410] Unsubscribe shared Calendar', async function (I, users) {

    const sharedCalendarName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar`;

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });

    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });

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
    I.waitForText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, undefined, '.tt-dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitToHide('.share-permissions-dialog');

    I.logout();

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[1] });
    I.login('app=io.ox/calendar', { user: users[1] });

    I.retry(5).doubleClick('~Shared calendars');
    I.waitForText(sharedCalendarName);

    I.retry(5).click('Add new calendar');
    I.click('Subscribe shared Calendar');

    I.waitForText('Subscribe shared calendars');

    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="com.openexchange.calendar.extendedProperties"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find('.checkbox'));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="com.openexchange.calendar.extendedProperties"]' }));

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForInvisible(locate('*').withText(sharedCalendarName));

    I.click('Add new calendar');
    I.click('Subscribe shared Calendar');

    I.waitForText('Subscribe shared calendars');

    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="com.openexchange.calendar.extendedProperties"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find('.checkbox'));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="com.openexchange.calendar.extendedProperties"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'label' }).withText('Sync via DAV'));

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText(sharedCalendarName);
});
