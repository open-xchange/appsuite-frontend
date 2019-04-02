/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;
const moment = require('moment');
const _ = require('underscore');

Feature('Calendar > Misc');

Before(async (users) => {
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
    let sizesAndStyles = new Map([
        [400, 'width: 100%;'],
        [800, 'width: 50%;'],
        [1200, 'width: 33.3333%;'],
        [1400, 'width: 25%;'],
        [1800, 'width: 16.6667%;']
    ]);

    let resizeAndCheckStyle = async (windowWidth, expectedStyle) => {
        I.resizeWindow(windowWidth, 1000);
        let styles = await I.grabAttributeFrom('.year-view .month-container', 'style');
        styles.forEach(style => expect(style).to.include(expectedStyle));
    };
    // Expected Result: Layout switches between a one-, two-, four or six-columned view
    // TODO: actually there is also a three columned layout, need to verify this is correct
    sizesAndStyles.forEach(async (style, width) => await resizeAndCheckStyle(width, style));

    // 4. Use the arrow icons at the top of the view to move between years.
    let actualYearString = await I.grabTextFrom('.year-view .info'),
        actualYear = parseInt(actualYearString, 10);

    let checkCorrectYear = async (addedYears) => {
        let yearString = await I.grabTextFrom('.year-view .info'),
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
    let checkCorrectDays = async (addedYears) => {
        let startDay = moment().startOf('year').add(addedYears, 'years').format('d'),
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
