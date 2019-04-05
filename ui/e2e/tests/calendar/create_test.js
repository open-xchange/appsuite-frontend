/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jorin Laatsch <jorin.laatsch@open-xchange.com>
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


/// <reference path="../../steps.d.ts" />

const moment = require('moment');
const expect = require('chai').expect;
const waitForExpect = require('wait-for-expect');

Feature('Calendar > Create');

Before(async (users) => {
    await users.create();
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

var addAttendee = function (I, name, context) {
    context = context || '';
    I.fillField(context + ' .add-participant.tt-input', name);
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
};

var checkInAllViews = async function (I, subject, location) {

    // // 1) day view
    I.clickToolbar('View');
    I.click('Day', '.smart-dropdown-container');

    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment = appointmentSelector.inside('.weekiew-container.day')
        .as('appointment element in day view');

    I.waitForText(subject, appointment);
    I.waitForText(location, appointment);

    // // 2) week view
    appointment = appointmentSelector.inside('.weekview-container.week')
        .as('appointment element in week view');
    I.clickToolbar('View');
    I.click('Week', '.smart-dropdown-container');
    I.wait(1);

    I.waitForText(subject, appointment);
    I.waitForText(location, appointment);

    // // 3) month view
    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.monthview-container')
        .as('appointment element in month view');

    // don't look for location in month view (usually subject is too long so location is out of view)
    I.waitForText(subject, appointment);

    // // 4) list view
    I.clickToolbar('View');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.calendar-list-view')
        .as('appointment element in list view');

    I.waitForText(subject, appointment);
    I.waitForText(location, appointment);

};

Scenario('[C7411] Discard appointment during the creation', function (I) {
    const time = moment().format('YYYY-MM-DD HH:mm');
    I.login('app=io.ox/calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment ' + time);
    I.fillField('Location', 'TestLocation');
    I.click('Discard');
    I.click('Discard changes');
    I.waitToHide('.io-ox-calendar-edit');
});

Scenario('[C7417] Create a Yearly recurring appointment every 16 day of December, no end', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const date = moment('1216', 'MMDD');

    I.login('app=io.ox/calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Yearly');
    I.see('Every year in December on day 16.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every year in December on day 16.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    if (moment().isSame(date, 'week')) {
        I.waitForVisible('.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
    }

    // select the next 16.th december via the mini calendar
    const diffMonth = date.diff(moment().startOf('month'), 'months');
    for (let i = 0; i < diffMonth; i++) I.click('~Go to next month', '.window-sidepanel');

    // and select the correct date
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Workweek', 'Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

    for (let i = 0; i < 12; i++) I.click('~Go to next month', '.window-sidepanel');
    // and select the following year
    I.click(`~${date.add(1, 'year').format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Workweek', 'Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });
});

Scenario('[C7418] Create a Yearly recurring appointment last day of week in december, ends after 5', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const date = moment('12', 'MM').weekday(0);
    if (date.month() === 10) date.add(1, 'week'); // special cases

    I.login('app=io.ox/calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Yearly');
    I.checkOption('Weekday');
    I.see('Every year on the first Sunday in December.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every year on the first Sunday in December.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    if (moment().isSame(date, 'week')) {
        I.waitForVisible('.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
    }

    // select the next 16.th december via the mini calendar
    const diffMonth = date.diff(moment().startOf('month'), 'months');
    for (let i = 0; i < diffMonth; i++) I.click('~Go to next month', '.window-sidepanel');

    // and select the correct date
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

    for (let i = 0; i < 12; i++) I.click('~Go to next month', '.window-sidepanel');
    // and select the following year
    date.add(1, 'year').startOf('month').weekday(0);
    if (date.month() === 10) date.add(1, 'week'); // special cases
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });
});

Scenario('[C7419] Create a monthly recurring appointment on day 10 ends 31/12/2020', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const date = moment('10', 'DD');

    I.login('app=io.ox/calendar');

    // and select the correct date
    I.retry(5).click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Monthly');
    I.selectOption('.modal-dialog [name="until change:occurrences"]', 'On specific date');
    I.waitForElement('~Date (M/D/YYYY)', undefined, '.modal-dialog');
    I.click('~Date (M/D/YYYY)', '.modal-dialog');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment(date).add(6, 'years').format('l'));
    I.pressKey('Enter');
    I.see('Every month on day 10.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every month on day 10.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

    I.click('~Go to next month', '.window-sidepanel');
    date.add(1, 'month');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

});

Scenario('[C7420] Create a monthly recurring appointment every second Monday every month never ends', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const date = moment().startOf('month').weekday(1);
    if (date.month() === moment().subtract(1, 'month').month()) date.add(1, 'week'); // special cases
    date.add(1, 'week');

    I.login('app=io.ox/calendar');

    // and select the correct date
    I.retry(5).click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Monthly');
    I.checkOption('Weekday');
    I.see('Every month on the second Monday.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every month on the second Monday.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

    I.click('~Go to next month', '.window-sidepanel');
    date.add(1, 'month').startOf('month').weekday(1);
    if (date.month() === moment().month()) date.add(1, 'week'); // special cases
    date.add(1, 'week');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

});

Scenario('[C7421] Create a weekly recurring appointment every 2 weeks Sunday ends after 3', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const date = moment().startOf('day').weekday(0);

    I.login('app=io.ox/calendar');

    // and select the correct date
    I.retry(5).click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Weekly');
    I.fillField('Interval', 2);
    I.selectOption('.modal-dialog [name="until change:occurrences"]', 'After a number of occurrences');
    I.waitForElement('.modal-dialog [name="occurrences"]');
    I.fillField('.modal-dialog [name="occurrences"]', '3');
    I.pressKey('Enter');

    I.see('Every 2 weeks on Sunday.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every 2 weeks on Sunday.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
    });

    // check for the two future weeks
    for (let i = 0; i < 2; i++) {
        if (!date.isSame(moment(date).add(2, 'week'), 'month')) I.click('~Go to next month', '.window-sidepanel');
        date.add(2, 'weeks');
        I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

        // open all views and load the appointments there
        ['Week', 'Day', 'Month'].forEach((view) => {
            I.clickToolbar('View');
            I.click(view);
            I.waitForVisible('.appointment', undefined, '.page.current');
            I.see('Testappointment');
        });
    }

    // three weeks in the future, the appointment should not appear
    if (!date.isSame(moment(date).add(2, 'week'), 'month')) I.click('~Go to next month', '.window-sidepanel');
    date.add(2, 'weeks');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Week', 'Day'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForInvisible('.appointment', undefined, '.page.current');
        I.dontSee('Testappointment');
    });

});

Scenario('[C7422] Create a allday weekly recurring appointment every Tuesday Thursday never ends', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const date = moment().startOf('day').weekday(2);

    I.login('app=io.ox/calendar');

    // and select the correct date
    I.retry(5).click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.wait(0.2); // gently wait for some UI updates
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Tuesday.');

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Weekly');
    I.click('Th', '.modal-dialog');

    I.see('Every Tuesday and Thursday.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every Tuesday and Thursday.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
        if (view === 'week') I.seeNumberOfVisibleElements('.page.current .appointment', 2);
    });

});

Scenario('[C7423] Create daily recurring appointment every day ends after 5', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    // pick the second monday in the following month
    const date = moment().add(1, 'month').startOf('month').weekday(1);
    if (date.isSame(moment(), 'month')) date.add(1, 'week');

    I.login('app=io.ox/calendar');

    // and select the correct date
    I.retry(5).click('~Go to next month', '.window-sidepanel');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');
    I.selectOption('.modal-dialog [name="until change:occurrences"]', 'After a number of occurrences');
    I.waitForElement('.modal-dialog [name="occurrences"]');
    I.fillField('.modal-dialog [name="occurrences"]', '5');
    I.pressKey('Enter');

    I.see('Every day.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every day.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    ['Month', 'Week'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible('.appointment', undefined, '.page.current');
        I.see('Testappointment');
        I.seeNumberOfVisibleElements('.page.current .appointment', 5);
    });

    I.click('~Next Week', '.page.current');

    // open all views and dont see the appointments there
    I.clickToolbar('View');
    I.click('Week');
    I.dontSeeElement('Testappointment');

});

Scenario('[C7424] Create daily recurring appointment every 2 days ends in x+12', async function (I) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    // pick the second monday in the following month
    const date = moment().add(1, 'month').startOf('month').weekday(1);
    if (date.isSame(moment(), 'month')) date.add(1, 'week');

    I.login('app=io.ox/calendar');

    // and select the correct date
    I.retry(5).click('~Go to next month', '.window-sidepanel');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(date.format('l'));
    I.pressKey('Enter');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');
    I.fillField('Interval', 2);
    I.selectOption('.modal-dialog [name="until change:occurrences"]', 'After a number of occurrences');
    I.waitForElement('.modal-dialog [name="occurrences"]');
    I.fillField('.modal-dialog [name="occurrences"]', '8'); // just repeat 8 times to stay in the current month
    I.pressKey('Enter');

    I.see('Every 2 days.');

    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.see('Every 2 days.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    I.clickToolbar('View');
    I.click('Month');
    I.waitForVisible('.appointment', undefined, '.page.current');
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 8);

    // first week
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible('.appointment', undefined, '.page.current');
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 3);

    // second week
    I.click('~Next Week', '.page.current');
    I.waitForVisible('.appointment', undefined, '.page.current');
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 4);

    // third week
    I.click('~Next Week', '.page.current');
    I.waitForVisible('.appointment', undefined, '.page.current');
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 1);

});

Scenario('[C274537] Support use-count calculation on Appointment create with Groups', async function (I, users) {
    let testrailID = 'C274537';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    let numberOfGroups = 3;
    for (let i = 0; i < numberOfGroups; i++) {
        const group = {
            name: timestamp + '-00' + (i + 1),
            display_name: timestamp + '-00' + (i + 1),
            members: [
                users[0].userdata.id,
                users[1].userdata.id
            ]
        };
        await I.haveGroup(group, { user: users[0] });
    }
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.clickToolbar('New');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    I.fillField('.io-ox-calendar-edit [name="summary"]', testrailID);
    I.fillField('.add-participant.tt-input', timestamp + '-00');
    I.waitForElement('.twitter-typeahead');
    let result1 = [];
    I.waitForElement('.tt-suggestions .participant-name');
    for (let i = 0; i < numberOfGroups; i++) {
        result1.push(await I.executeScript(function (i) {
            return $('.tt-suggestions .participant-name').eq(i).text().toString();
        }, i, result1));
    }
    expect(result1[0]).to.equal(timestamp + '-001');
    expect(result1[1]).to.equal(timestamp + '-002');
    expect(result1[2]).to.equal(timestamp + '-003');
    I.clearField('.add-participant.tt-input');
    I.fillField('.add-participant.tt-input', timestamp + '-003');
    I.waitForElement('//div[@class="participant-name"]//strong[@class="tt-highlight"][contains(text(),"' + timestamp + '-003")]');
    I.click('//div[@class="participant-name"]//strong[@class="tt-highlight"][contains(text(),"' + timestamp + '-003")]');
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit [name="summary"]');
    I.waitForElement('.appointment-container [aria-label="' + testrailID + '"]', 5);
    I.clickToolbar('New');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    I.fillField('.io-ox-calendar-edit [name="summary"]', testrailID);
    I.fillField('.add-participant.tt-input', timestamp + '-00');
    I.waitForElement('.twitter-typeahead');
    let result2 = [];
    I.waitForElement('.tt-suggestions .participant-name');
    for (let i = 0; i < numberOfGroups; i++) {
        result2.push(await I.executeScript(function (i) {
            return $('.tt-suggestions .participant-name').eq(i).text().toString();
        }, i, result2));
    }
    expect(result2[0]).to.equal(timestamp + '-003');
    expect(result2[1]).to.equal(timestamp + '-001');
    expect(result2[2]).to.equal(timestamp + '-002');
    await I.dontHaveGroup(/\d+-\d{3}/);
});

Scenario('[C274516] Follow up should also propose a future date for appointments in the future', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C274516';
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
            value: moment().add(1, 'week').add(1, 'day').format('YYYYMMDD')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(1, 'week').format('YYYYMMDD')
        },
        attendees: [
        ]
    }, { user: users[0] });
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
    expect(endDate.toString()).to.equal(moment().add(2, 'week').format('M/D/YYYY'));
    I.click('Create');
    I.waitForElement('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-panel [aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    expect(await I.grabTextFrom('.io-ox-sidepopup-pane .date-time')).to.equal(moment().add(2, 'week').format('ddd') + ', ' + moment().add(2, 'week').format('M/D/YYYY') + '   Whole day');
    I.logout();
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
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
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
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id
            }
        ]
    }, { user: users[0] });
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

Scenario('[C274484] Attendees can change the appointment', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C274484';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[1] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[1] });
    I.haveSetting('io.ox/calendar//chronos/allowAttendeeEditsByDefault', true, { user: users[1] });
    I.haveSetting('io.ox/calendar//viewView', 'week:week', { user: users[1] });
    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
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
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id
            }
        ]
    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
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
