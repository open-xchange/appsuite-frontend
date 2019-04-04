/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect,
    moment = require('moment'),
    _ = require('underscore');

Feature('Calendar > Misc');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
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

    I.logout();
});

Scenario('[C236795] Visibility Flags', (I) => {
    const createAppointment = (subject, startDate, startTime, visibility) => {
        I.clickToolbar('New');
        I.waitForVisible('.io-ox-calendar-edit-window');

        I.fillField('Subject', subject);
        I.click('~Date (M/D/YYYY)');
        I.pressKey(['Control', 'a']);
        I.pressKey(startDate);
        I.pressKey('Enter');

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

        // TODO: check if this is wanted behavior
        // for now close the sidepopup
        I.waitForVisible('.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
        I.waitForDetached('.io-ox-sidepopup');

    };

    const getAppointmentLocator = function (subject, visibilityLabel) {
        const appointmentLocator = locate('.appointment')
            .withDescendant(
                locate('div.title')
                    .withText(subject))
            .inside('.io-ox-pagecontroller.current .scrollpane');
        if (!visibilityLabel) {
            return appointmentLocator;
        }
        return appointmentLocator.withDescendant(locate('span').withAttr({ title: visibilityLabel }));
    };

    const checkAppointment = (subject, visibility, time) => {
        createAppointment(subject, moment().startOf('isoWeek').format('M/D/YYYY'), time, visibility);
        // PRIVATE => Private
        // CONFIDENTIAL => Secret
        let visibilityLabel;
        if (visibility === 'PRIVATE') {
            visibilityLabel = 'Private';
        } else if (visibility === 'CONFIDENTIAL') visibilityLabel = 'Confidential';

        // Expected Result: You created 3 appointsments with visivilities of Public, Private, Secret
        // Each visibility is displayed as in the example
        I.seeElement(getAppointmentLocator(subject, visibilityLabel));
    };

    I.login(['app=io.ox/calendar&perspective=week:week']);
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // 1. Create 3 appointments:
    // Set 1 of the 3 different visibilities to each appointment
    checkAppointment('Standard visibility', 'PUBLIC', '12:00 PM');
    checkAppointment('Private visibility', 'CONFIDENTIAL', '1:00 PM');
    checkAppointment('Secret visibility', 'PRIVATE', '2:00 PM');

    I.logout();
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

    const daysLocator = locate('td').after('.cw').inside('.window-sidepanel .date-picker .grid'),
        days = new Set(await I.grabTextFrom(daysLocator));

    // Expected Result: The whole month is displayed
    expect(days.size).to.equal(31);
    _.range(1, 32).forEach(day => expect(days.has(`${day}`)).to.be.true);

    // 7. Select a day
    const seventeenLocator = locate('td.date').withText('17').inside('.window-sidepanel .date-picker .grid .date');
    I.click(seventeenLocator);

    // Expected Result: The selected year, month and day is shown in the view on the right
    I.see(`July ${minYear + 8}`, '.weekview-container .info');
    I.see('17', '.weekview-container .weekview-toolbar .weekday');

    I.logout();
});

Scenario('[C244785] Open event from invite notification in calendar', async (I, users) => {
    const [userA, userB] = users;

    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false } }, { user: userB });

    // 1. User#A: Create an appointment which starts in less than 15 minutes and invite User#B
    I.login(['app=io.ox/calendar&perspective=week:week'], { user: userA });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Totally nerdy event');

    const startTime = moment().add(10, 'minutes'),
        endTime = moment().add(70, 'minutes');
    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKey(startTime.format('hh:mm P'));
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
    I.waitForDetached('#io-ox-notifications-icon.open');
    I.waitForText('Totally nerdy event', 5, '.appointment');
    I.seeElement('.io-ox-sidepopup');
    I.seeNumberOfElements('.calendar-detail.view', 1);
    I.see('Totally nerdy event', '.io-ox-sidepopup');
    I.see(`${startTime.format('ddd, M/D/YYYY')}`, '.io-ox-sidepopup .date');
    I.see(`${startTime.format('h:mm')} – ${endTime.format('h:mm A')}CEST`, '.io-ox-sidepopup .time');
    I.see(`${userA.userdata.sur_name}, ${userA.userdata.given_name}`, '.io-ox-sidepopup');
    I.see(`${userB.userdata.sur_name}, ${userB.userdata.given_name}`, '.io-ox-sidepopup');

    I.logout();
});
