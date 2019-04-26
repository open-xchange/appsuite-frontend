/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
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

// Check: There actually may be a legitimate bug here or is it intended that shared private appointments don't appear in list view?
Scenario.skip('[C7412] Create private appointment @contentReview @bug', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    const testrailID = 'C7412';
    const timestamp = Math.round(+new Date() / 1000);
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    const folder = {
        module: 'event',
        subscribed: 1,
        title: testrailID,
        permissions: [
            {
                bits: 403710016,
                entity: users[0].userdata.id,
                group: false
            }, {
                bits: 4227332,
                entity: users[1].userdata.id,
                group: false
            }
        ]
    };
    const sharedFolderID = await I.createFolder(folder, 'cal://0/' + appointmentDefaultFolder, { user: users[0] });
    await I.haveAppointment({
        folder: sharedFolderID.data.data,
        summary: timestamp,
        location: timestamp,
        description: timestamp,
        attendeePrivileges: 'MODIFY',
        class: 'CONFIDENTIAL',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('isoWeek').add(10, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('isoWeek').add(8, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });

    I.login('app=io.ox/calendar', { user: users[1] });
    I.doubleClick('~Shared calendars');
    I.waitForVisible(`[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${testrailID}"]`);
    I.doubleClick(`[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${testrailID}"]`);
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForText('Private');
        I.dontSee(timestamp);
        I.dontSee(timestamp);
    });
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
        I.see('Testappointment');
    });

    for (let i = 0; i < 12; i++) I.click('~Go to next month', '.window-sidepanel');
    // and select the following year
    I.click(`~${date.add(1, 'year').format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Workweek', 'Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
    I.selectOption('.modal-dialog [name="until"]', 'On specific date');
    I.waitForElement(locate('~Date (M/D/YYYY)').inside('.modal-dialog'));
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
        I.see('Testappointment');
    });

    I.click('~Go to next month', '.window-sidepanel');
    date.add(1, 'month');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, '.window-sidepanel');

    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
    ['Week', 'Day', 'Month'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
    I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
            I.waitForVisible(locate('.appointment').inside('.page.current'));
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
        I.waitForInvisible(locate('.appointment').inside('.page.current'));
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
    I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
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
        I.waitForVisible(locate('.appointment').inside('.page.current'));
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
    I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
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
    I.waitForVisible(locate('.appointment').inside('.page.current'));
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 8);

    // first week
    I.clickToolbar('View');
    I.click('Week');
    I.waitForVisible(locate('.appointment').inside('.page.current'));
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 3);

    // second week
    I.click('~Next Week', '.page.current');
    I.waitForVisible(locate('.appointment').inside('.page.current'));
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 4);

    // third week
    I.click('~Next Week', '.page.current');
    I.waitForVisible(locate('.appointment').inside('.page.current'));
    I.see('Testappointment');
    I.seeNumberOfVisibleElements('.page.current .appointment', 1);

});

Scenario('[C271749] Show prompt on event creation in public calendar', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });

    // Create a public calendar (Cal#A)
    I.login('app=io.ox/calendar');
    I.waitForText('Add new calendar');
    I.click('Add new calendar');
    I.waitForText('Personal calendar');
    I.click('Personal calendar');
    I.waitForVisible('.modal-body');
    I.fillField('Calendar name', 'Cal#A');
    I.checkOption('Add as public calendar');
    I.click('Add');
    I.waitForVisible('#io-ox-core');

    // Open create new appointment dialog
    I.doubleClick(locate('~Public calendars'));
    I.clickToolbar('New');

    // Check dialog on event creation in public calendars'
    I.waitForText('Appointments in public calendars');
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
    const testrailID = 'C274516';
    const appointmentSelector = `~${testrailID}, ${testrailID}`;
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
    I.waitForElement(appointmentSelector, 5, '.appointment-panel');
    I.click(appointmentSelector, '.appointment-panel');
    I.waitForElement('.io-ox-calendar-main .io-ox-sidepopup', 5);
    I.waitForText('Follow-up');
    I.click('Follow-up');
    I.waitForElement('.io-ox-calendar-edit', 5);
    I.waitForVisible('.io-ox-calendar-edit', 5);
    let startDate = await I.grabAttributeFrom('[data-attribute="startDate"] .datepicker-day-field', 'value');
    let endDate = await I.grabAttributeFrom('[data-attribute="endDate"] .datepicker-day-field', 'value');
    expect(startDate.toString()).to.equal(moment().add(2, 'week').format('M/D/YYYY'));
    expect(endDate.toString()).to.equal(moment().add(2, 'week').format('M/D/YYYY'));
    I.click('Create');
    I.waitToHide('.io-ox-calendar-edit');

    // Workaround for sidepopup, may be removed in the future
    I.click('~Close');
    I.waitToHide('.io-ox-sidepopup');

    I.waitForVisible('.next');
    I.click('.next');
    I.waitForElement(appointmentSelector, 5, '.appointment-panel');
    I.click(appointmentSelector, '.appointment-panel');
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
    const testrailID = 'C274484';
    const timestamp = Math.round(+new Date() / 1000);
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
    I.waitForText('Edit', 5);
    I.click('Edit');
    I.waitForElement('.io-ox-calendar-edit.container');
    I.waitForVisible('.io-ox-calendar-edit.container');
    I.fillField('description', timestamp);
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

Scenario('[C7428] Create appointment with internal participants', async function (I, users) {

    I.login('app=io.ox/calendar&perspective="week:day"');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Einkaufen');
    I.fillField('Location', 'Wursttheke');

    I.click('~Select contacts');
    I.waitForVisible('.addressbook-popup', 5);
    I.waitForFocus('.addressbook-popup .search-field');
    I.fillField('.addressbook-popup .search-field', users[1].get('name'));
    I.wait(2);
    I.click('.addressbook-popup li:first-child');
    I.wait(2);
    I.click('Select');
    I.waitToHide('.addressbook-popup');
    I.waitForText(users[1].get('name'), 5, '.participant-email');
    I.click('Create');

    await checkInAllViews(I, 'Einkaufen', 'Wursttheke');
    I.logout();

    I.login('app=io.ox/calendar&perspective="week:day"', { user: users[1] });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    await checkInAllViews(I, 'Einkaufen', 'Wursttheke');

    I.openApp('Mail');
    I.waitForText('New appointment: Einkaufen');
});

Scenario('[C7425] Create appointment with a group', async function (I, users) {

    const group = {
        name: 'Awesome guys',
        display_name: 'Awesome guys',
        members: [
            users[0].userdata.id,
            users[1].userdata.id
        ]
    };

    await I.dontHaveGroup('Awesome guys');
    await I.haveGroup(group);

    I.login('app=io.ox/calendar&perspective=week:day');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Ich war hier');
    I.fillField('Location', 'Wer das liest ist doof');

    addAttendee(I, 'Awesome guys');

    I.waitForText(users[0].get('name'), 5);
    I.waitForText(users[1].get('name'), 5);

    I.click('Create');

    await checkInAllViews(I, 'Ich war hier', 'Wer das liest ist doof');

    I.logout();

    I.login('app=io.ox/calendar&perspective=week:day', { user: users[1] });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    await checkInAllViews(I, 'Ich war hier', 'Wer das liest ist doof');

    I.openApp('Mail');
    I.waitForText('New appointment: Ich war hier');

    await I.dontHaveGroup('Awesome guys');

});

Scenario('[C7429] Create appointment via Contact', async function (I, users) {

    I.login('app=io.ox/contacts');
    I.waitForVisible({ css: '*[data-app-name="io.ox/contacts"]' });

    // use search to find our second user
    I.click('.search-box input');
    I.waitForVisible('.io-ox-contacts-window.io-ox-find-active');
    I.pressKey(users[1].get('sur_name'));
    I.pressKey('Enter');
    I.wait(1);

    I.clickToolbar('Invite');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Wichtige Dinge tun');
    I.fillField('Location', 'Kneipe');

    I.click('Create');

    I.openApp('Calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // cannot use check in all views here because i click toolbar is broken after appchange
    I.click('View', '.io-ox-calendar-main .classic-toolbar');
    I.click('Day', '.smart-dropdown-container');

    var cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment = appointmentSelector.inside('.weekview-container.day')
        .as('appointment element in day view');

    I.waitForText('Wichtige Dinge tun', appointment);
    I.waitForText('Kneipe', appointment);

    // // 2) week view
    I.click('View', '.io-ox-calendar-main .classic-toolbar');
    I.click('Week', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.weekview-container.week')
        .as('appointment element in week view');

    I.waitForText('Wichtige Dinge tun', appointment);
    I.waitForText('Kneipe', appointment);

    // // 3) month view
    I.click('View', '.io-ox-calendar-main .classic-toolbar');
    I.click('Month', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.monthview-container')
        .as('appointment element in month view');

    I.waitForText('Wichtige Dinge tun', appointment);

    // // 4) list view
    I.click('View', '.io-ox-calendar-main .classic-toolbar');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.calendar-list-view')
        .as('appointment element in list view');

    I.waitForText('Wichtige Dinge tun', appointment);
    I.waitForText('Kneipe', appointment);

    I.logout();

    I.login('app=io.ox/calendar&perspective=week:day', { user: users[1] });
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"] .appointment' });

    await checkInAllViews(I, 'Wichtige Dinge tun', 'Kneipe');

});


Scenario('[C7430] Create appointment via Icon', async function (I) {

    I.login('app=io.ox/calendar&perspective="week:day"');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Einkaufen');
    I.fillField('Location', 'Wursttheke');

    I.click('[data-attribute="startDate"] .datepicker-day-field');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().add(1, 'day').format('M/D/YYYY'));

    I.pressKey('Enter');

    I.click('~Start time');
    I.click('12:00 PM', 'fieldset[data-attribute="startDate"]');

    I.click('Create');

    await checkInAllViews(I, 'Einkaufen', 'Wursttheke');
});

Scenario('[C7431] Create appointment via doubleclick', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    var createInPerspective = async function (perspective) {

        I.clickToolbar('View');
        I.click(perspective, '.smart-dropdown-container');
        I.wait(1);
        // there are 48 timeslots use 25th here so we can check for 50% top position later on. Makes this test way easier
        I.doubleClick('.io-ox-pagecontroller.current .day .timeslot:nth-child(25)');
        I.waitForVisible('.io-ox-calendar-edit-window');

        I.fillField('Subject', 'Todesstern testen');
        I.fillField('Location', 'Alderaan');

        I.click('Create');
        I.waitForVisible('.appointment');
        var value = await I.grabAttributeFrom('.io-ox-pagecontroller.current .appointment', 'style');
        expect(value[0]).to.include('top: 50%');
        await I.removeAllAppointments();
    };

    await createInPerspective('Day');
    await createInPerspective('Workweek');
    await createInPerspective('Week');

    //month is special, there are no timeslots etc
    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');
    I.wait(1);

    I.doubleClick('.io-ox-pagecontroller.current .day .list');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Todesstern testen');
    I.fillField('Location', 'Alderaan');

    I.click('Create');
    I.waitForVisible('.appointment');
});

Scenario('[C256455] Create all-day appointment via date label', async function (I) {

    I.login('app=io.ox/calendar&perspective=week:week');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // today is visible on calendar start, so we can just use the start of the current week to get the apps currently displayed time.
    var startDate = moment().startOf('week');

    var createOnfirstDay = async function () {
        I.click('.io-ox-pagecontroller.current .weekday:first-child');
        I.waitForVisible('.io-ox-calendar-edit-window');

        I.fillField('Subject', 'Grillen');
        I.fillField('Location', 'Olpe');

        I.seeCheckboxIsChecked('[name="allDay"]');
        I.seeInField('[data-attribute="startDate"] .datepicker-day-field', startDate.format('M/D/YYYY'));

        I.click('Create');
        I.waitForVisible('.appointment');
        I.see('Grillen', '.io-ox-pagecontroller.current .appointment-panel');
        I.seeCssPropertiesOnElements('.io-ox-pagecontroller.current .appointment-panel .appointment', { 'left': '0px' });

        await I.removeAllAppointments();
    };

    await createOnfirstDay();

    startDate.add(1, 'days');
    I.clickToolbar('View');
    I.click('Workweek', '.smart-dropdown-container');
    I.wait(1);

    await createOnfirstDay();

    I.logout();
});

Scenario('[C7436] Create appointment without any infos', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('Create');

    I.see('Please enter a value');
});


Scenario('[C7440] Start/End date autoadjustment', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    // strings are usually the same, but if this test is run around midnight, we may get a one day difference, so we must calculate that
    var [startString] = await I.grabValueFrom('[data-attribute="startDate"] .datepicker-day-field'),
        [endString] = await I.grabValueFrom('[data-attribute="endDate"] .datepicker-day-field'),
        startDate = moment(startString, 'M/D/YYYY'),
        diff = startDate.diff(moment(endString, 'M/D/YYYY'), 'days'),
        check = async function (direction, toChange) {
            // start today
            I.click('[data-attribute="' + toChange + '"] .datepicker-day-field');
            I.click('.date-picker.open .btn-today');
            // change month
            I.click('[data-attribute="' + toChange + '"] .datepicker-day-field');
            I.click('.date-picker.open .btn-' + direction);
            // quite funny selector but this makes sure we don't click on one of the greyed out days of last month (:not selector does not work...)
            I.click('.date-picker.open tr:first-child .date:last-child');

            I.wait(1);

            //check if the fields are updated to the expected values
            [startString] = await I.grabValueFrom('[data-attribute="startDate"] .datepicker-day-field');
            [endString] = await I.grabValueFrom('[data-attribute="endDate"] .datepicker-day-field');
            expect(moment(startString, 'M/D/YYYY').add(diff, 'days').format('M/D/YYYY')).to.equal(endString);
        };


    await check('next', 'startDate');
    await check('prev', 'startDate');
    await check('prev', 'endDate');

    // end date next is special, startDate must stay the same endDate must be updated

    // start today
    I.click('[data-attribute="endDate"] .datepicker-day-field');
    I.click('.date-picker.open .btn-today');
    // change month
    I.click('[data-attribute="endDate"] .datepicker-day-field');
    I.click('.date-picker.open .btn-next');
    // quite funny selector but this makes sure we don't click on one of the greyed out days of last month (:not selector does not work...)
    I.click('.date-picker.open tr:first-child .date:last-child');

    I.wait(1);
    var [newStartString] = await I.grabValueFrom('[data-attribute="startDate"] .datepicker-day-field'),
        [newEndString] = await I.grabValueFrom('[data-attribute="endDate"] .datepicker-day-field');
    expect(newStartString).to.equal(startString);
    expect(newEndString).to.not.equal(endString);
});

Scenario('[C7441] Start/End time autocompletion', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('[data-attribute="startDate"] .time-field');
    I.click('12:00 PM');

    var check = async function (time, toChange, expectedStartTime, expectedEndTime) {
        // start today
        I.click('[data-attribute="' + toChange + '"] .time-field');
        I.click(time, '[data-attribute="' + toChange + '"]');

        //check if the fields are updated to the expected values
        expect((await I.grabValueFrom('[data-attribute="startDate"] .time-field'))[0]).to.equal(expectedStartTime);
        expect((await I.grabValueFrom('[data-attribute="endDate"] .time-field'))[0]).to.equal(expectedEndTime);
    };

    await check('1:00 PM', 'startDate', '1:00 PM', '2:00 PM');
    await check('12:00 PM', 'startDate', '12:00 PM', '1:00 PM');
    await check('11:00 AM', 'endDate', '10:00 AM', '11:00 AM');
    await check('1:00 PM', 'endDate', '10:00 AM', '1:00 PM');
});

Scenario('[C7442] Set date from date-picker', async function (I) {

    I.login('app=io.ox/calendar&perspective=week:day');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', '2. Weihnachten');
    I.fillField('Location', 'Nordpol');

    // same starting point everytime, today would make this too difficult
    I.click('[data-attribute="startDate"] .datepicker-day-field');
    I.pressKey(['Control', 'a']);
    I.pressKey('3/3/2019');
    I.pressKey('Enter');

    I.click('[data-attribute="startDate"] .datepicker-day-field');
    I.seeElement('.date-picker.open');

    // month
    I.see('March 2019', '.date-picker.open');
    // 42 days shown, 11 of them outside of march
    I.seeNumberOfVisibleElements('.date-picker.open td.date', 42);
    I.seeNumberOfVisibleElements('.date-picker.open td.date.outside', 11);

    I.click('.date-picker.open .btn-next');

    I.see('April 2019', '.date-picker.open');
    // 35 days shown, 5 of them outside of April
    I.seeNumberOfVisibleElements('.date-picker.open td.date', 35);
    I.seeNumberOfVisibleElements('.date-picker.open td.date.outside', 5);

    I.click('.date-picker.open .btn-prev');
    I.click('.date-picker.open .btn-prev');

    I.see('February 2019', '.date-picker.open');
    // 35 days shown, 7 of them outside of february
    I.seeNumberOfVisibleElements('.date-picker.open td.date', 35);
    I.seeNumberOfVisibleElements('.date-picker.open td.date.outside', 7);

    I.click('.date-picker.open .navigation .switch-mode');

    // year
    I.see('2019', '.date-picker.open');
    I.seeNumberOfVisibleElements('.date-picker.open .month', 12);

    I.click('.date-picker.open .btn-next');

    I.see('2020', '.date-picker.open');
    I.seeNumberOfVisibleElements('.date-picker.open .month', 12);

    I.click('.date-picker.open .btn-prev');
    I.click('.date-picker.open .btn-prev');

    I.see('2018', '.date-picker.open');
    I.seeNumberOfVisibleElements('.date-picker.open .month', 12);

    I.click('.date-picker.open .navigation .switch-mode');

    // decades ...kind of, it's actually 12 years but pressing next only advances 10...*shrug*
    I.see('2010 - 2022', '.date-picker.open');
    I.seeNumberOfVisibleElements('.date-picker.open .year', 12);

    I.click('.date-picker.open .btn-next');

    I.see('2020 - 2032', '.date-picker.open');
    I.seeNumberOfVisibleElements('.date-picker.open .year', 12);

    I.click('.date-picker.open .btn-prev');
    I.click('.date-picker.open .btn-prev');

    I.see('2000 - 2012', '.date-picker.open');
    I.seeNumberOfVisibleElements('.date-picker.open .year', 12);

    // select a date. just use 12/26/1999 for convenience (always click the first date)
    I.click('.date-picker.open tr:first-child td:first-child');
    I.click('.date-picker.open tr:first-child td:first-child');
    I.click('.date-picker.open tr:first-child td:nth-child(2)');

    I.seeInField('[data-attribute="startDate"] .datepicker-day-field', '12/26/1999');

    I.click('Create');

    // use script to jump to the correct date
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1999-12-26"))');

    //check in calendar
    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment = appointmentSelector.inside('.weekview-container.day')
        .as('appointment element in day view');

    I.waitForText('2. Weihnachten', appointment);
    I.waitForText('Nordpol', appointment);

    I.see('Sun, 12/26/1999', '.weekview-container.day');

});

Scenario('[C7413] Create appointment with an attachment', async function (I) {
    // Preconditions: You are at the Calendar-tab
    I.login(['app=io.ox/calendar&perspective=week:week']);
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // 1. Click to the "New" icon at the top left
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    // 2. Enter a title and location
    const startTime = moment().add(1, 'hour'),
        endTime = moment().add(2, 'hour'),
        subject = `The Long Dark ${startTime.format('h A')} Tea-Time of the Soul`,
        location = 'London';
    I.fillField('Subject', subject);
    I.fillField('Location', location);

    // 3. Add start- and endtime (Starts on: now+1 hour)
    I.click('~Start time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKey(startTime.format('hh:mm P'));
    I.pressKey('Enter');
    I.click('~End time');
    I.pressKey('Enter');
    I.pressKey(['Control', 'a']);
    I.pressKey(endTime.format('hh:mm P'));
    I.pressKey('Enter');

    // 4. Click to "Add attachments", then Add
    I.pressKey('Pagedown');
    I.see('Attachments', '.io-ox-calendar-edit-window');
    I.attachFile('.io-ox-calendar-edit-window input[type="file"]', 'e2e/media/files/generic/testdocument.odt');
    I.attachFile('.io-ox-calendar-edit-window input[type="file"]', 'e2e/media/files/generic/testdocument.rtf');

    // 5. Click "Create".
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // 6. Check this appointment in all views.
    // Expected Results: The appointment is added correctly, with the attachment.
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
});

Scenario('[C274406] Change organizer of appointment with external attendees', async function (I, users) {
    const subject = 'To be or not to be Organizor';
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', subject);
    I.fillField('Location', 'Globe Theatre');

    addAttendee(I, users[1].get('name'));
    I.fillField('.add-participant.tt-input', 'ExcellentExternalExterminator@Extraterrestrial.ex');
    I.pressKey('Enter');

    I.click('Create');

    I.waitForText(subject, undefined, '.appointment');
    I.click(subject, '.appointment');
    I.click('.calendar-detail .more-dropdown');
    I.waitForVisible('.dropdown-menu');
    I.dontSee('Change organizer');

    I.click('.smart-dropdown-container');

    I.click('Edit');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('Repeat');

    I.click('Save');

    I.waitForText(subject, undefined, '.appointment');
    I.click(subject, '.appointment');
    I.click('.calendar-detail .more-dropdown');
    I.waitForVisible('.dropdown-menu');
    I.dontSee('Change organizer');
});

// Skip for now, request fails with:
// Ignored invalid data [id, field Visibility, severity MAJOR, message Unable to store a 'private' classification]
Scenario.skip('[C274651] Create secret appointment @contentReview', async function (I, users) {
    let testrailID = 'C274651';
    var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    const folder = {
        module: 'event',
        subscribed: 1,
        title: testrailID,
        permissions: [
            {
                bits: 403710016,
                entity: users[0].userdata.id,
                group: false
            }, {
                bits: 4227332,
                entity: users[1].userdata.id,
                group: false
            }
        ]
    };
    const sharedFolderID = await I.createFolder(folder, 'cal://0/' + appointmentDefaultFolder, { user: users[0] });
    await I.haveAppointment({
        folder: sharedFolderID.data.data,
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('isoWeek').add(10, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().startOf('isoWeek').add(8, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        attendees: [
            {
                partStat: 'ACCEPTED',
                entity: users[0].userdata.id
            }
        ],
        class: 'PRIVATE',
        visibility: 'PRIVATE',
        alarms: [],
        transp: 'OPAQUE',
        attendeePrivileges: 'DEFAULT',
        summary: timestamp,
        location: timestamp,
        description: timestamp

    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[1] });
    I.doubleClick('~Shared calendars');
    I.waitForVisible(`[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${testrailID}"]`);
    I.doubleClick(`[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${testrailID}"]`);
    ['Workweek', 'Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        I.waitForText('Private');
        I.dontSee(timestamp);
        I.dontSee(timestamp);
    });
});

Scenario('[C7414] Create two appointments at the same time (one is shown as free)', async function (I, users) {
    const moment = require('moment');
    let testrailID = 'C7414';
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
        attendeePrivileges: 'MODIFY',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().format('YYYYMMDD[T]HHmm00')
        },
        attendees: [
            {
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id
            }
        ]
    }, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.clickToolbar('New');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    I.fillField('.io-ox-calendar-edit [name="summary"]', testrailID);
    I.fillField('.io-ox-calendar-edit [name="location"]', testrailID);
    I.click('Show as free');
    I.click('Create');
    I.waitForDetached(locate('.modal-open .modal-title').withText('Conflicts detected'));
});

Scenario('[C7415] Create two reserved appointments at the same time', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');

    const moment = require('moment');
    const testrailID = 'C7415';
    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    await I.haveAppointment({
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
            value: moment().format('YYYYMMDD[T]HHmm00')
        },
        attendees: [
            {
                partStat: 'ACCEPTED',
                entity: users[1].userdata.id
            }
        ]
    }, { user: users[0] });

    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    expect(await I.grabNumberOfVisibleElements(`.appointment-container [aria-label="${testrailID}, ${testrailID}"]`)).to.equal(1);
    I.clickToolbar('New');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    I.fillField('.io-ox-calendar-edit [name="summary"]', testrailID);
    I.fillField('.io-ox-calendar-edit [name="location"]', testrailID);
    I.click('Create');
    I.waitForElement(locate('.modal-open .modal-title').withText('Conflicts detected'));
    I.click('Ignore conflicts');
    I.waitForDetached('.modal-open');
    I.click('~Refresh');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    expect(await I.grabNumberOfVisibleElements(`.appointment-container [aria-label="${testrailID}, ${testrailID}"]`)).to.equal(2);
});

Scenario('[C7446] Create recurring whole-day appointment', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.clickToolbar('New');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    I.fillField('.io-ox-calendar-edit [name="summary"]', 'Birthday of Linus Torvalds');
    I.fillField('.io-ox-calendar-edit [name="location"]', 'Helsinki Imbiss');
    I.fillField('.io-ox-calendar-edit [name="description"]', 'Buy some gifts');
    I.click('All day');
    I.click('[data-attribute="startDate"] .datepicker-day-field');
    I.pressKey(['Control', 'a']);
    I.pressKey(['Backspace']);
    I.fillField('[data-attribute="startDate"] .datepicker-day-field', '12/28/1969');
    I.pressKey('Enter');
    //recurrence
    I.click('Repeat');
    I.click('.recurrence-view button');
    I.waitForVisible('.recurrence-view-dialog');
    I.selectOption('.recurrence-view-dialog [name="recurrence_type"]', 'Yearly');
    I.click('Apply');
    I.waitForDetached('.recurrence-view-dialog');
    //recurrence
    I.click('Create');
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1969-12-28"))');
    I.waitForVisible('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]');
    expect(await I.grabNumberOfVisibleElements('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]')).to.equal(1);
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1968-12-28"))');
    expect(await I.grabNumberOfVisibleElements('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]')).to.equal(0);
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1967-12-28"))');
    expect(await I.grabNumberOfVisibleElements('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]')).to.equal(0);
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1975-12-28"))');
    I.waitForVisible('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]');
    expect(await I.grabNumberOfVisibleElements('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]')).to.equal(1);
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1995-12-28"))');
    I.waitForVisible('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]');
    expect(await I.grabNumberOfVisibleElements('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]')).to.equal(1);
    I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2025-12-28"))');
    I.waitForVisible('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]');
    expect(await I.grabNumberOfVisibleElements('.appointment-panel [aria-label="Birthday of Linus Torvalds, Helsinki Imbiss"]')).to.equal(1);
});


Scenario('[C7447] Private appointment with participants', async function (I, users) {
    //var timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.clickToolbar('New');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    I.fillField('.io-ox-calendar-edit [name="summary"]', 'Private appointment with participants');
    I.fillField('.io-ox-calendar-edit [name="location"]', 'PrivateRoom');
    I.fillField('input.add-participant.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.selectOption('[data-extension-id="private_flag"] select', 'Private');
    I.click('Create');
    ['Week', 'Day', 'Month', 'List'].forEach((view) => {
        I.clickToolbar('View');
        I.click(view);
        if (view === 'Week') {
            I.waitForVisible('[data-page-id="io.ox/calendar/week:week');
            I.waitForVisible('.reserved.private[aria-label="Private appointment with participants, PrivateRoom"] .appointment-content');
        } else if (view === 'Day') {
            I.waitForVisible('[data-page-id="io.ox/calendar/week:day');
            I.waitForVisible('.reserved.private[aria-label="Private appointment with participants, PrivateRoom"] .appointment-content');
        } else if (view === 'Month') {
            I.waitForVisible('[data-page-id="io.ox/calendar/month"]');
            I.waitForVisible('.reserved.private[aria-label="Private appointment with participants, PrivateRoom"] .appointment-content');
        } else if (view === 'List') {
            I.waitForVisible('[data-page-id="io.ox/calendar/list"]');
            I.waitForVisible(locate('.reserved.list-item-content').withText('Private appointment with participants'));
        }
    });
});

Scenario('[C7448] Cannot create private appointment', async function (I, users) {
    let testrailID = 'C7448';
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    const folder = {
        module: 'event',
        subscribed: 1,
        title: testrailID,
        permissions: [
            {
                bits: 403710016,
                entity: users[0].userdata.id,
                group: false
            }, {
                bits: 4227332,
                entity: users[1].userdata.id,
                group: false
            }
        ]
    };
    I.createFolder(folder, 'cal://0/' + appointmentDefaultFolder, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.selectFolder(testrailID);
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('On behalf of the owner');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    expect(await I.grabNumberOfVisibleElements('option[value="CONFIDENTIAL"]')).to.equal(0);
});

Scenario('[C234658] Create appointments and show this in cumulatively view', async function (I, users) {
    const
        Moment = require('moment'),
        MomentRange = require('moment-range'),
        moment = MomentRange.extendMoment(Moment);
    let testrailID = 'C234658';
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    I.haveSetting('io.ox/calendar//selectedFolders', {});
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    const numberOfRuns = 2;
    for (let i = 0; i < numberOfRuns; i++) {
        var folder = {
            module: 'event',
            subscribed: 1,
            title: testrailID + ' - ' + i
        };
        var folderID = await I.createFolder(folder, 'cal://0/' + appointmentDefaultFolder, { user: users[0] });
        var appointment = {
            folder: folderID.data.data,
            summary: testrailID,
            location: testrailID,
            description: testrailID,
            endDate: {
                tzid: 'Europe/Berlin',
                value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
            },
            startDate: {
                tzid: 'Europe/Berlin',
                value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00')
            }
        };
        await I.haveAppointment(appointment, { user: users[0] });
    }
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    await waitForExpect(async () => {
        expect(await I.grabNumberOfVisibleElements('.appointment-container [aria-label="C234658, C234658"]')).to.equal(0);
    }, 5000);
    I.click('[data-id="virtual/flat/event/private"] [title="' + testrailID + ' - 0' + '"] .color-label');
    await waitForExpect(async () => {
        expect(await I.grabNumberOfVisibleElements('.appointment-container [aria-label="C234658, C234658"]')).to.equal(1);
    }, 5000);
    I.click('[data-id="virtual/flat/event/private"] [title="' + testrailID + ' - 1' + '"] .color-label');
    await waitForExpect(async () => {
        expect(await I.grabNumberOfVisibleElements('.appointment-container [aria-label="C234658, C234658"]')).to.equal(2);
    }, 5000);
});

Scenario('[C265153] Create appointment with a link in the description', async function (I, users) {
    const
        Moment = require('moment'),
        MomentRange = require('moment-range'),
        moment = MomentRange.extendMoment(Moment);
    let testrailID = 'C265153';
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    var appointment = {
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: 'https://www.google.de',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    };
    await I.haveAppointment(appointment, { user: users[0] });
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [aria-label="C265153, C265153"]');
    I.click('.appointment-container [aria-label="C265153, C265153"]');
    I.waitForElement('.calendar-detail [href="https://www.google.de"]');
    I.click('.calendar-detail [href="https://www.google.de"]');
    I.switchToNextTab();
    await waitForExpect(async () => {
        expect(await I.grabCurrentUrl()).to.equal('https://www.google.de/');
    }, 5000);
});
