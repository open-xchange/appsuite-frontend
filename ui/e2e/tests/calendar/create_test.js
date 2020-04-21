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

Feature('Calendar > Create');

Before(async (I, users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
});
After(async (users) => {
    await users.removeAll();
});

Scenario('Create appointment with all fields', async (I, calendar, dialogs) => {
    const data = { subject: 'test title', location: 'test location' };

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.click('~Next Week', { css: '.page.current' });

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', data.subject);
    I.fillField('Location', data.location);
    I.selectOption('Visibility', 'Private');
    I.fillField(calendar.locators.starttime, '12:00 PM');
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.say('Check');
    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment;

    ['Day', 'Week', 'Workweek', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (location) => {
        appointment = appointmentSelector.inside(location).as(`appointment element in ${perspective}`);
        I.waitForText('test title', 5, appointment);
        I.see('test location', appointment);
        I.seeElement(appointment.find(perspective === 'List' ? '.private-flag' : '.confidential-flag'));
    }));

    // delete the appointment thus it does not create conflicts for upcoming appointments
    I.say('Delete');
    I.click(appointment);
    I.waitForText('Delete');
    I.click('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached(appointment);
});

Scenario('Fullday appointments', async (I, calendar) => {
    const data = { subject: 'Fullday' };

    I.login('app=io.ox/calendar&perspective="week:week"');
    calendar.waitForApp();

    calendar.newAppointment();
    I.fillField('Subject', data.subject);
    I.checkOption('All day');
    await calendar.setDate('startDate', moment().startOf('week').add('1', 'day'));
    await calendar.setDate('endDate', moment().endOf('week').subtract('1', 'day'));
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.click(data.subject, '.weekview-container.week .appointment');
    I.waitForText('5 days', 5, '.io-ox-sidepopup .calendar-detail');
    calendar.deleteAppointment();
});

//See Bug 64409
// TODO: shaky (element (~Start time) is not in DOM or there is no element(~Start time) with value "9:52 AM" after 30 sec)
Scenario('Enter start time and press enter key', (I, calendar) => {
    I.login('app=io.ox/calendar');

    calendar.waitForApp();
    calendar.newAppointment();

    I.click(calendar.locators.starttime);
    I.clearField(calendar.locators.starttime);
    I.fillField(calendar.locators.starttime, '09:52');
    I.pressKey('Enter');

    I.waitForValue('~Start time', '9:52 AM');
});

Scenario('[C7411] Discard appointment during the creation', (I, calendar) => {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();

    I.fillField('Subject', 'Subject C7411');
    I.fillField('Location', 'Location C7411');

    I.click('Discard');
    I.click('Discard changes');
    I.waitToHide(calendar.locators.edit);
    I.dontSee('Subject C7411');
});

// TODO: creation of shared appointment happened via api call?!
Scenario('[C7412] Create private appointment @contentReview @bug', async (I, users, calendar) => {
    const title = 'C7412';
    const somedetail = Math.round(+new Date() / 1000);
    const today = moment('12:00:00', 'HH:mm:ss');
    const folder = await I.haveFolder({
        title,
        module: 'event',
        parent: await calendar.defaultFolder(),
        permissions: [
            { bits: 403710016, entity: users[0].userdata.id, group: false },
            { bits: 4227332, entity: users[1].userdata.id, group: false }
        ]
    });

    await I.haveAppointment({
        folder,
        summary: somedetail,
        location: somedetail,
        description: somedetail,
        attendeePrivileges: 'MODIFY',
        class: 'CONFIDENTIAL',
        startDate: { tzid: 'Europe/Berlin', value: today.clone().add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: today.clone().add(4, 'hours').format('YYYYMMDD[T]HHmm00') }
    });

    I.say('Login with second user');
    I.login('app=io.ox/calendar&perspective=week:week', { user: users[1] });
    calendar.waitForApp();

    I.retry(5).click({ css: `[aria-label*="${today.format('l, dddd')}, CW ${today.week()}"]` }, calendar.locators.mini);

    I.say('Show appointments of first user');
    I.waitForText('Shared calendars');
    I.doubleClick('~Shared calendars');
    I.waitForVisible({ css: `[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${title}"]` });
    I.doubleClick({ css: `[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${title}"]` });

    I.say('Check views');
    ['Day', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, () => {
        I.waitForText('Private');
        I.dontSee(somedetail);
    }));
});

Scenario('[C7417] Create a Yearly recurring appointment every 16 day of December, no end', async (I, calendar, dialogs) => {
    const date = moment('1216', 'MMDD');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);

    I.click(locate({ css: 'div.checkbox.custom.small' }).find('label').withText('Repeat').as('Repeat'), '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);
    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Yearly');
    I.see('Every year in December on day 16.');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every year in December on day 16.');

    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.say('Check next occurrence');
    const diffMonth = date.diff(moment().startOf('month'), 'months');
    for (let i = 0; i < diffMonth; i++) I.click('~Go to next month', calendar.locators.mini);
    I.click({ css: `[aria-label*="${date.format('l, dddd')}, CW ${date.week()}"]` }, calendar.locators.mini);
    ['Workweek', 'Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

    I.say('Check occurrence after next');
    for (let i = 0; i < 12; i++) I.click('~Go to next month', calendar.locators.mini);
    I.click(`~${date.add(1, 'year').format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    ['Workweek', 'Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));
});

Scenario('[C7418] Create a Yearly recurring appointment last day of week in december, ends after 5', async (I, calendar, dialogs) => {
    const date = moment('12', 'MM').weekday(0);
    if (date.month() === 10) date.add(1, 'week'); // special cases

    I.login('app=io.ox/calendar&perspective="week:week"');
    calendar.waitForApp();

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);
    I.fillField(calendar.locators.starttime, '6:00 AM');
    I.pressKey('Enter');

    I.click(locate({ css: 'div.checkbox.custom.small' }).find('label').withText('Repeat').as('Repeat'), '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);
    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Yearly');
    I.waitForText('Weekday');
    I.click({ css: 'input[value="weekday"]' });
    I.see('Every year on the first Sunday in December.');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every year on the first Sunday in December.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.say('Check next occurrence');
    const diffMonth = date.diff(moment().startOf('month'), 'months');
    for (let i = 0; i < diffMonth; i++) I.click('~Go to next month', calendar.locators.mini);
    // and select the correct date
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

    I.say('Check occurrence after next');
    for (let i = 0; i < 12; i++) I.click('~Go to next month', calendar.locators.mini);
    date.add(1, 'year').startOf('month').weekday(0);
    if (date.month() === 10) date.add(1, 'week'); // special cases
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));
});

Scenario('[C7419] Create a monthly recurring appointment on day 10 ends 31/12/2020', async (I, calendar, dialogs) => {
    const date = moment('10', 'DD');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    // and select the correct date
    I.retry(5).click(`//td[contains(@aria-label, "${date.format('l, dddd')}, CW ${date.week()}")]`, calendar.locators.mini);

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);

    I.click(locate({ css: 'div.checkbox.custom.small' }).find('label').withText('Repeat').as('Repeat'), '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);

    I.say('Create > Recurrence');
    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Monthly');
    I.selectOption('.modal-dialog [name="until"]', 'On specific date');
    I.waitForElement(locate('~Date (M/D/YYYY)').inside('.modal-dialog'));
    await calendar.setDate('until', moment(date).add(6, 'years'));
    I.see('Every month on day 10.');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every month on day 10.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Check next occurrence');
    ['Week', 'Day', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

    I.say('Check occurrence after next');
    I.click('~Go to next month', calendar.locators.mini);
    date.add(1, 'month');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

});

Scenario('[C7420] Create a monthly recurring appointment every second Monday every month never ends', async (I, calendar, dialogs) => {
    const date = moment().startOf('month').weekday(1);
    if (date.month() === moment().subtract(1, 'month').month()) date.add(1, 'week'); // special cases
    date.add(1, 'week');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.retry(5).click(`//td[contains(@aria-label, "${date.format('l, dddd')}, CW ${date.week()}")]`, calendar.locators.mini);

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);

    I.say('Create > Recurrence');
    I.click(locate({ css: 'div.checkbox.custom.small' }).find('label').withText('Repeat').as('Repeat'), '.io-ox-calendar-edit-window');
    I.click(`Every ${date.format('dddd')}.`);
    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);
    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Monthly');
    I.waitForText('Weekday');
    I.click({ css: 'input[value="weekday"]' });
    I.see('Every month on the second Monday.');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every month on the second Monday.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForInvisible('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    I.say('Check next occurrence');
    ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

    I.say('Check occurrence after next');
    I.click('~Go to next month', calendar.locators.mini);
    date.add(1, 'month').startOf('month').weekday(1);
    if (date.month() === moment().month()) date.add(1, 'week'); // special cases
    date.add(1, 'week');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    // open all views and load the appointments there
    ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

});

Scenario('[C7421] Create a weekly recurring appointment every 2 weeks Sunday ends after 3', async (I, calendar, dialogs) => {
    const date = moment().startOf('week');
    I.say(date);

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.retry(5).click({ css: `[aria-label*="${date.format('l, dddd')}, CW ${date.week()}"` }, calendar.locators.mini);

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);

    I.say('Create > Recurrence');
    calendar.recurAppointment(date);
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('.modal-dialog [name="recurrence_type"]', 'Weekly');
        I.fillField('Interval', 2);
        I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
        I.waitForElement('.modal-dialog [name="occurrences"]');
        I.fillField('.modal-dialog [name="occurrences"]', '3');
        I.pressKey('Enter');
        I.see('Every 2 weeks on Sunday.');
    });
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every 2 weeks on Sunday.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Check next occurrence');
    ['Week', 'Day', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

    I.say('Check next two future occurrences');
    for (let i = 0; i < 2; i++) {
        if (!date.isSame(moment(date).add(2, 'week'), 'month')) I.click('~Go to next month', calendar.locators.mini);
        date.add(2, 'weeks');
        I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
        ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
            I.waitForVisible(locate('.appointment').inside(locator));
            I.see('Testappointment');
        }));
    }

    I.say('Check end of series');
    if (!date.isSame(moment(date).add(2, 'week'), 'month')) I.click('~Go to next month', calendar.locators.mini);
    date.add(2, 'weeks');
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    ['Week', 'Day'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForInvisible(locate('.appointment').inside(locator));
        I.dontSee('Testappointment');
    }));

});

Scenario('[C7422] Create a allday weekly recurring appointment every Tuesday Thursday never ends', async (I, calendar) => {
    const date = moment().startOf('day').weekday(2);

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.retry(5).click({ css: `[aria-label*="${date.format('l, dddd')}, CW ${date.week()}"]` }, calendar.locators.mini);

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);

    I.say('Create > Recurrence');
    calendar.recurAppointment(date);
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('[name="recurrence_type"]', 'Weekly');
        I.click('Th');
        I.see('Every Tuesday and Thursday.');
        I.click('Apply');
    });
    I.waitForDetached(calendar.locators.recurrenceview);
    I.see('Every Tuesday and Thursday.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Check next two future occurrences');
    ['Week', 'Day', 'Month'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
        if (perspective === 'Week') I.seeNumberOfVisibleElements('.page.current .appointment', 2);
    }));
});

Scenario('[C7423] Create daily recurring appointment every day ends after 5', async (I, calendar, dialogs) => {
    // pick the second monday in the following month
    const date = moment().add(1, 'month').startOf('month').weekday(1);
    if (date.isSame(moment(), 'month')) date.add(1, 'week');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.retry(5).click('~Go to next month', calendar.locators.mini);
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);

    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);

    I.say('Create > Recurrence');
    calendar.recurAppointment(date);
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('[name="recurrence_type"]', 'Daily');
        I.selectOption('[name="until"]', 'After a number of occurrences');
        I.waitForElement('[name="occurrences"]');
        I.fillField('[name="occurrences"]', '5');
        I.pressKey('Enter');
        I.see('Every day.');
    });
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every day.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // open all views and load the appointments there
    I.say('Check next occurrences');
    ['Month', 'Week'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
        I.seeNumberOfVisibleElements('.page.current .appointment', 5);
    }));

    I.say('Check end of series');
    I.click('~Next Week', '.page.current');
    ['Week'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForInvisible(locate('.appointment').inside(locator));
        I.dontSeeElement('Testappointment');
    }));
});

Scenario('[C7424] Create daily recurring appointment every 2 days ends in x+12', async (I, calendar, dialogs) => {
    // pick the second monday in the following month
    const date = moment().add(1, 'month').startOf('month').weekday(1);
    if (date.isSame(moment(), 'month')) date.add(1, 'week');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    // and select the correct date
    I.retry(5).click('~Go to next month', calendar.locators.mini);
    I.click(`~${date.format('l, dddd')}, CW ${date.week()}`, calendar.locators.mini);
    I.waitForDetached(locate('#io-ox-refresh-icon .fa-spin'));

    calendar.newAppointment();
    I.fillField('Subject', 'Testappointment');
    await calendar.setDate('startDate', date);


    I.say('Create > Recurrence');
    calendar.recurAppointment(date);
    within(calendar.locators.recurrenceview, () => {
        I.selectOption('[name="recurrence_type"]', 'Daily');
        I.fillField('Interval', 2);
        I.selectOption('[name="until"]', 'After a number of occurrences');
        I.waitForElement('[name="occurrences"]');
        I.fillField('[name="occurrences"]', '8'); // just repeat 8 times to stay in the current month
        I.pressKey('Enter');
        I.see('Every 2 days.');
    });
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');
    I.see('Every 2 days.');

    // create
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Check next occurrences');
    ['Month', 'Week'].forEach(perspective => calendar.withinPerspective(perspective, (locator) => {
        I.waitForVisible(locate('.appointment').inside(locator));
        I.see('Testappointment');
    }));

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

Scenario('[C274537] Support use-count calculation on Appointment create with Groups', async (I, users, calendar) => {
    const testrailID = 'C274537';
    const timestamp = Math.round(+new Date() / 1000);
    const result1 = [], result2 = [];

    I.say('Preparation and login');
    await Promise.all([0, 1, 2].map(i => I.haveGroup({
        name: timestamp + '-00' + (i + 1),
        display_name: timestamp + '-00' + (i + 1),
        members: [users[0].userdata.id, users[1].userdata.id]
    })));
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.say('Create');
    calendar.newAppointment();
    I.fillField('[name="summary"]', testrailID);

    I.say('Search for groups');
    I.fillField('.add-participant.tt-input', timestamp + '-00');
    I.waitForElement('.twitter-typeahead');

    I.say('Check inital order of groups');
    I.waitForElement('.tt-suggestions .participant-name');
    for (let i = 0; i < 3; i++) {
        result1.push(await I.executeScript(i => $('.tt-suggestions .participant-name').eq(i).text().toString(), i, result1));
    }
    expect(result1[0]).to.equal(timestamp + '-001');
    expect(result1[1]).to.equal(timestamp + '-002');
    expect(result1[2]).to.equal(timestamp + '-003');
    I.clearField('.add-participant.tt-input');

    I.say('Add last group as participant');
    I.fillField('.add-participant.tt-input', timestamp + '-003');
    I.waitForElement({ xpath: '//div[@class="participant-name"]//strong[@class="tt-highlight"][contains(text(),"' + timestamp + '-003")]' });
    I.click({ xpath: '//div[@class="participant-name"]//strong[@class="tt-highlight"][contains(text(),"' + timestamp + '-003")]' });
    I.click('Create');
    I.waitForDetached(calendar.locators.edit);
    I.waitForElement('.appointment-container [title="' + testrailID + '"]', 5);

    I.say('Check new order of groups');
    calendar.newAppointment();
    I.fillField('[name="summary"]', testrailID);
    I.fillField('.add-participant.tt-input', timestamp + '-00');
    I.waitForElement('.twitter-typeahead');
    I.waitForElement('.tt-suggestions .participant-name');
    for (let i = 0; i < 3; i++) {
        result2.push(await I.executeScript(i => $('.tt-suggestions .participant-name').eq(i).text().toString(), i, result2));
    }
    expect(result2[0]).to.equal(timestamp + '-003');
    expect(result2[1]).to.equal(timestamp + '-001');
    expect(result2[2]).to.equal(timestamp + '-002');

    await I.dontHaveGroup(/\d+-\d{3}/);
});

Scenario('[C274516] Follow up should also propose a future date for appointments in the future', async (I, calendar) => {
    const testrailID = 'C274516';
    const appointmentSelector = `.appointment-content[title="${testrailID}"]`;
    const date = moment().add(2, 'week');
    const SIDEPOPUP = locate({ css: '.io-ox-calendar-main .io-ox-sidepopup' }).as('Sidepopup');

    I.say('Preparation and login');
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        startDate: { tzid: 'Europe/Berlin', value: moment().add(1, 'week').format('YYYYMMDD') },
        endDate: { tzid: 'Europe/Berlin', value: moment().add(1, 'week').add(1, 'day').format('YYYYMMDD') }
    });
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.say('Navigate to next week');
    I.clickToolbar('Today');
    I.waitForElement('.next');
    I.waitForVisible('.next');
    I.click('.next');

    I.say('Open Sidepopup');
    I.waitForElement(appointmentSelector, 5, '.appointment-panel');
    I.click(appointmentSelector, '.appointment-panel');
    I.waitForElement(SIDEPOPUP, 5);

    I.say('Create Follow-up');
    I.waitForText('Follow-up');
    I.click('Follow-up');
    I.waitForVisible(calendar.locators.startdate, 5);
    I.seeInField(calendar.locators.startdate, date.format('l'));
    I.seeInField(calendar.locators.enddate, date.format('l'));
    I.click('Create');
    I.waitToHide('.io-ox-calendar-edit');
    I.click('~Close', SIDEPOPUP);
    I.waitToHide(SIDEPOPUP);

    I.say('Check Follow-p');
    I.waitForVisible('.next');
    I.click('.next');
    I.waitForElement(appointmentSelector, 5, '.appointment-panel');
    I.click(appointmentSelector, '.appointment-panel');
    I.waitForText(`${date.format('ddd')}, ${date.format('l')}`, 10, '.io-ox-sidepopup');
    I.see('Whole day', '.io-ox-sidepopup');
});

Scenario('[C274515] Attendees are not allowed to change their own permission status', async (I, users, calendar) => {
    const SIDEPOPUP = locate({ css: '.io-ox-calendar-main .io-ox-sidepopup' }).as('Sidepopup');
    const testrailID = 'C274515';
    await I.haveSetting('io.ox/calendar//chronos/allowAttendeeEditsByDefault', true);
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        attendeePrivileges: 'MODIFY',
        startDate: { tzid: 'Europe/Berlin', value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate: { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') },
        attendees: [{
            partStat: 'ACCEPTED',
            entity: users[1].userdata.id
        }]
    });

    I.login('app=io.ox/calendar&perspective="week:week', { user: users[1] });
    calendar.waitForApp();

    I.say('Open sidepopup');
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [title="' + testrailID + ', ' + testrailID + '"]', 5);
    I.click('.appointment-container [title="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement(SIDEPOPUP, 5);

    I.say('Edit');
    I.waitForElement({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' }, 5);
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForElement(calendar.locators.edit);
    I.waitForVisible(calendar.locators.edit);
    I.waitForElement('.disabled.attendee-change-checkbox', 5);
});

Scenario('[C274484] Attendees can change the appointment', async (I, users, calendar) => {
    const SIDEPOPUP = locate({ css: '.io-ox-calendar-main .io-ox-sidepopup' }).as('Sidepopup');
    const testrailID = 'C274484';
    const timestamp = Math.round(+new Date() / 1000);
    const appointmentSelector = `.appointment-content[title="${testrailID}"]`;
    await I.haveSetting('io.ox/calendar//chronos/allowAttendeeEditsByDefault', true, { user: users[1] });
    //Create Appointment
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        attendeePrivileges: 'MODIFY',
        startDate: { tzid: 'Europe/Berlin', value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') },
        attendees: [{ partStat: 'ACCEPTED', entity: users[1].userdata.id }]
    });

    I.say('Login with first user');
    I.login('app=io.ox/calendar&perspective=week:week', { user: users[1] });
    calendar.waitForApp();
    I.waitForElement(appointmentSelector, 5);
    I.click(appointmentSelector);
    I.waitForElement(SIDEPOPUP, 5);
    I.waitForText('Edit', 5);
    I.click('Edit');
    I.waitForElement('.io-ox-calendar-edit.container');
    I.waitForVisible('.io-ox-calendar-edit.container');
    I.fillField('description', timestamp);
    I.click('Save');
    I.logout();

    I.say('Login with second user');
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.waitForElement(appointmentSelector, 5);
    I.click(appointmentSelector);
    I.waitForElement(SIDEPOPUP, 5);
    I.waitForText(timestamp, 5, SIDEPOPUP);
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario('[C7428] Create appointment with internal participants', async (I, users, calendar) => {
    const subject = 'Einkaufen';
    const location = 'Wursttheke';

    I.login('app=io.ox/calendar&perspective=week:day');
    calendar.waitForApp();

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', subject);
    I.fillField('Location', location);
    calendar.addParticipantByPicker(users[1].get('name'));
    I.click('Create');

    I.say('Check Views');
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (context) => {
        I.waitForText(subject, 5, context);
        I.waitForText(location, 5, context);
    }));

    I.say('Relogin');
    I.logout();
    I.login('app=io.ox/calendar&perspective="week:day"', { user: users[1] });
    calendar.waitForApp();

    I.say('Check Views');
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (context) => {
        I.waitForText(subject, 5, context);
        I.waitForText(location, 5, context);
    }));

    I.say('Check Mail');
    I.openApp('Mail');
    I.waitForText(`New appointment: ${subject}`);
});

Scenario('[C7425] Create appointment with a group', async (I, users, calendar, mail) => {
    const subject = 'C7425';
    const location = 'Group Therapy';
    const groupName = 'Awesome guys';

    await I.haveGroup({
        name: groupName,
        display_name: groupName,
        members: [users[0].userdata.id, users[1].userdata.id]
    });

    I.login('app=io.ox/calendar&perspective="week:day"');
    calendar.waitForApp();

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', subject);
    I.fillField('Location', location);
    I.fillField(calendar.locators.startdate, moment().startOf('day').format('MM/DD/YYYY'));
    I.clearField(calendar.locators.starttime);
    I.fillField(calendar.locators.starttime, '11:00 PM');

    await calendar.addParticipant(groupName);
    I.waitForText(users[0].get('name'), 5);
    I.waitForText(users[1].get('name'), 5);
    I.click('Create');

    I.say('Check Views');
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (context) => {
        I.waitForText(subject, 5, context);
        I.waitForText(location, 5, context);
    }));

    I.say('Relogin');
    I.logout();
    I.login('app=io.ox/calendar&perspective=week:day', { user: users[1] });
    calendar.waitForApp();

    I.say('Check Views');
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (context) => {
        I.waitForText(subject, 5, context);
        I.waitForText(location, 5, context);
    }));

    I.say('Check Mail');
    I.openApp('Mail');
    mail.waitForApp();
    I.waitForText(`New appointment: ${subject}`);

    await I.dontHaveGroup(groupName);
});

Scenario('[C7429] Create appointment via Contact', async (I, users, contacts, calendar) => {
    const data = { subject: 'Wichtige Dinge', location: 'Kneipe' };

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    I.say('Contacts: invite second user');
    I.click({ css: '.search-box input' });
    I.waitForVisible('.io-ox-contacts-window.io-ox-find-active');
    I.fillField('.token-input.tt-input', users[1].get('sur_name'));
    I.pressKey('Enter');
    I.waitForElement('.vgrid-cell.selectable');
    I.clickToolbar('Invite');

    I.say('Create Appointment');
    I.waitForVisible(locate({ css: '.io-ox-calendar-edit-window' }));
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
    I.fillField('Subject', 'Wichtige Dinge tun');
    I.fillField('Location', 'Kneipe');
    I.click('Create');

    I.say('Check Views');
    I.openApp('Calendar');
    calendar.waitForApp();
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (location) => {
        I.waitForText(data.subject, 5, location);
        // Month: missing space
        if (perspective !== 'Month') I.waitForText(data.location, 5, location);
    }));

    I.say('Relogin');
    I.logout();
    I.login('app=io.ox/calendar&perspective=week:day', { user: users[1] });
    calendar.waitForApp();

    I.say('Check Views');
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (location) => {
        I.waitForText(data.subject, 5, location);
        if (perspective !== 'Month') I.waitForText(data.location, 5, location);
    }));
});

Scenario('[C7430] Create appointment via Icon', async (I, calendar) => {
    const subject = 'Einkaufen';
    const location = 'Wursttheke';

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.say('Create');
    calendar.newAppointment();
    I.fillField('Subject', subject);
    I.fillField('Location', location);
    await calendar.setDate('startDate', moment());
    I.fillField(calendar.locators.starttime, '12:00 PM');
    I.click('Create');

    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (context) => {
        I.waitForText(subject, 5, context);
        I.waitForText(location, 5, context);
    }));
});

Scenario('[C7431] Create appointment via doubleclick', async (I, calendar) => {
    const subject = 'Todesstern testen';
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    const createInPerspective = async (perspective) => {
        I.say(perspective);
        calendar.switchView(perspective);
        // there are 48 timeslots use 25th here
        I.doubleClick('.io-ox-pagecontroller.current .day .timeslot:nth-child(25)');
        I.waitForVisible('.io-ox-calendar-edit-window');
        I.retry(5).fillField('Subject', subject);
        I.seeInField(calendar.locators.starttime, '12:00 PM');
        I.click('Create');
        I.waitForVisible({ css: '.page.current .appointment' });
        await I.removeAllAppointments();
    };

    await createInPerspective('Day');
    await createInPerspective('Week');

    // month is special, there are no timeslots etc
    I.say('Month');
    calendar.switchView('Month');
    I.retry(5).doubleClick('.io-ox-pagecontroller.current .day .list');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).fillField('Subject', subject);
    I.click('Create');
    I.waitForVisible('.appointment', 5);
});

Scenario('[C256455] Create all-day appointment via date label', async (I, calendar) => {
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    // today is visible on calendar start, so we can just use the start of the current week to get the apps currently displayed time.
    const startDate = moment().startOf('week');

    const createOnfirstDay = async () => {
        I.click('.io-ox-pagecontroller.current .weekday:first-child');
        I.waitForVisible('.io-ox-calendar-edit-window');
        I.retry(5).fillField('Subject', 'Grillen');
        I.fillField('Location', 'Olpe');
        I.seeCheckboxIsChecked({ css: '[name="allDay"]' });
        I.seeInField({ css: '[data-attribute="startDate"] .datepicker-day-field' }, startDate.format('M/D/YYYY'));
        I.click('Create');

        I.waitForVisible('.appointment');
        I.see('Grillen', '.io-ox-pagecontroller.current .appointment-panel');
        I.seeCssPropertiesOnElements('.io-ox-pagecontroller.current .appointment-panel .appointment', { 'left': '0px' });
        await I.removeAllAppointments();
    };

    await createOnfirstDay();

    startDate.add(1, 'days');
    calendar.switchView('Workweek');
    I.wait(1);

    await createOnfirstDay();
});

Scenario('[C7436] Create appointment without any infos', async function (I, calendar) {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();
    I.click('Create');
    I.see('Please enter a value');
});

Scenario('[C271749] Show prompt on event creation in public calendar', async function (I, calendar, dialogs) {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.waitForText('Add new calendar');
    I.click('Add new calendar');
    I.waitForText('Personal calendar');
    I.click('Personal calendar');
    dialogs.waitForVisible();
    I.waitForText('Add new calendar', 5, dialogs.locators.header);
    I.fillField('Calendar name', 'Cal#A');
    I.checkOption('Add as public calendar');
    dialogs.clickButton('Add');
    I.waitForDetached('.modal');

    // Open create new appointment dialog
    I.doubleClick(locate('~Public calendars'));
    I.clickToolbar('New appointment');
    // Check dialog on event creation in public calendars'
    I.waitForText('Appointments in public calendars');
});

// "datepicker open" doesn't work reliable when running puppeteer headerless
Scenario('[C7440] Start/End date autoadjustment', async function (I, calendar) {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();

    // strings are usually the same, but if this test is run around midnight, we may get a one day difference, so we must calculate that
    var startString = await calendar.getDate('startDate'),
        endString = await calendar.getDate('endDate'),
        startDate = moment(startString, 'M/D/YYYY'),
        diff = startDate.diff(moment(endString, 'M/D/YYYY'), 'days');

    await check('next', 'startDate');
    await check('prev', 'startDate');
    await check('prev', 'endDate');
    async function check(direction, toChange) {
        // start today
        I.click({ css: '[data-attribute="' + toChange + '"] .datepicker-day-field' });
        I.waitForVisible('.date-picker.open');
        I.click('.date-picker.open .btn-today');
        I.waitForDetached('.datepicker.open');
        // change month
        I.click({ css: '[data-attribute="' + toChange + '"] .datepicker-day-field' });
        I.click('.date-picker.open .btn-' + direction);
        // quite funny selector but this makes sure we don't click on one of the greyed out days of last month (:not selector does not work...)
        I.click('.date-picker.open tr:first-child .date:last-child');
        I.waitForDetached('.date-picker.open');

        //check if the fields are updated to the expected values
        startString = await calendar.getDate('startDate');
        endString = await calendar.getDate('endDate');
        expect(moment(startString, 'M/D/YYYY').add(diff, 'days').format('M/D/YYYY')).to.equal(endString);
    }

    // end date next is special, startDate must stay the same endDate must be updated
    // start today
    I.click({ css: '[data-attribute="endDate"] .datepicker-day-field' });
    I.click('.date-picker.open .btn-today');
    I.waitForDetached('.datepicker.open');
    // change month
    I.click({ css: '[data-attribute="endDate"] .datepicker-day-field' });
    I.click('.date-picker.open .btn-next');
    // quite funny selector but this makes sure we don't click on one of the greyed out days of last month (:not selector does not work...)
    I.click('.date-picker.open tr:first-child .date:last-child');
    I.waitForDetached('.datepicker.open');

    var newStartString = await calendar.getDate('startDate'),
        newEndString = await calendar.getDate('endDate');
    expect(newStartString).to.equal(startString);
    expect(newEndString).to.not.equal(endString);
});

Scenario('[C7441] Start/End time autocompletion', async function (I, calendar) {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    calendar.newAppointment();

    I.fillField('Subject', 'C7441');
    I.click(calendar.locators.starttime);
    I.click({ css: '[data-attribute="startDate"] [data-value="1:00 PM"]' });

    var check = function (time, toChange, expectedStartTime, expectedEndTime) {
        I.say(`Check ${toChange} with time ${time}`);
        // start today
        I.click({ css: '[data-attribute="' + toChange + '"] .time-field' });
        I.click(time, { css: '[data-attribute="' + toChange + '"]' });
        I.seeInField(calendar.locators.starttime, expectedStartTime);
        I.seeInField(calendar.locators.endtime, expectedEndTime);
    };

    check('1:00 PM', 'startDate', '1:00 PM', '2:00 PM');
    check('12:00 PM', 'startDate', '12:00 PM', '1:00 PM');
    check('11:00 AM', 'endDate', '10:00 AM', '11:00 AM');
    check('1:00 PM', 'endDate', '10:00 AM', '1:00 PM');
});

Scenario('[C7442] Set date from date-picker', async function (I, calendar) {
    I.login('app=io.ox/calendar&perspective=week:day');
    calendar.waitForApp();
    calendar.newAppointment();

    I.fillField('Subject', '2. Weihnachten');

    // same starting point everytime, today would make this too difficult
    await calendar.setDate('startDate', new moment('2019-03-03'));

    I.click({ css: '[data-attribute="startDate"] .datepicker-day-field' });
    I.seeElement('.date-picker.open');
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

    I.seeInField(calendar.locators.startdate, '12/26/1999');
    I.pressKey('Enter');
    I.fillField('Location', 'Nordpol');
    I.say(await calendar.getDate('startDate'));
    I.click('Create');

    await I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("1999-12-26"))');
    I.waitForVisible('.appointment');
    //check in calendar
    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    const appointment = appointmentSelector.inside('.weekview-container.day')
        .as('appointment element in day view');

    I.waitForText('2. Weihnachten', appointment);
    I.waitForText('Nordpol', appointment);

    I.see('Sun, 12/26/1999', '.weekview-container.day');

});

Scenario('[C7413] Create appointment with an attachment', async (I, calendar) => {
    // Preconditions: You are at the Calendar-tab
    I.login(['app=io.ox/calendar&perspective=week:week']);
    calendar.waitForApp();

    I.say('Create appointment');
    calendar.newAppointment();
    const subject = 'The Long Dark Tea-Time of the Soul',
        location = 'London';
    I.fillField('Subject', subject);
    I.fillField('Location', location);
    // C7413: removed start/end time (out of scope)
    I.say('Add attachments');
    I.pressKey('Pagedown');
    I.see('Attachments', '.io-ox-calendar-edit-window');
    I.attachFile('.io-ox-calendar-edit-window input[type="file"]', 'e2e/media/files/generic/testdocument.odt');
    I.attachFile('.io-ox-calendar-edit-window input[type="file"]', 'e2e/media/files/generic/testdocument.rtf');
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Check appointment in all views.');
    const seeAttachments = (context) => {
        I.waitForElement(context);
        I.waitForText(subject, undefined, context);
        I.see('testdocument.odt', context);
        I.see('testdocument.rtf', context);
    };
    ['Week', 'Day', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, () => {
        I.waitForText(subject, 5, '.page.current .appointment');
        I.click(subject, '.page.current .appointment');
        seeAttachments(perspective === 'List' ? '.calendar-detail-pane' : '.io-ox-sidepopup');
        // close sidepopup
        I.pressKey('Escape');
    }));
});

Scenario('[C274406] Change organizer of appointment with external attendees', async (I, users, calendar) => {
    const subject = 'To be or not to be Organizor';
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.say('Create appointment');
    calendar.newAppointment();
    I.fillField('Subject', subject);
    I.fillField('Location', 'Globe Theatre');
    await calendar.addParticipant(users[1].get('name'));
    I.fillField('.add-participant.tt-input', 'ExcellentExternalExterminator@Extraterrestrial.ex');
    I.pressKey('Enter');
    I.click('Create');

    I.say('Check');
    I.waitForText(subject, undefined, '.appointment');
    I.click(subject, '.appointment');
    I.waitForElement('.calendar-detail .more-dropdown .dropdown-toggle');
    I.wait(1);
    I.click('.calendar-detail .more-dropdown .dropdown-toggle');
    I.waitForElement('.smart-dropdown-container.open');
    I.dontSee('Change organizer');
    I.click('.smart-dropdown-container');

    I.say('Edit appointment');
    I.waitForText('Edit');
    I.wait(1);
    I.click('Edit');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).click(locate({ css: 'div.checkbox.custom.small' }).find('label').withText('Repeat').as('Repeat'));
    I.click('Save');

    I.say('Check');
    I.waitForText(subject, undefined, '.appointment');
    I.wait(1);
    I.click(subject, '.appointment');
    I.waitForElement('.calendar-detail .more-dropdown .dropdown-toggle');
    I.wait(1);
    I.click('.calendar-detail .more-dropdown .dropdown-toggle');
    I.waitForElement('.smart-dropdown-container.open');
    I.dontSee('Change organizer');
});

Scenario('[C274651] Create secret appointment', async function (I, users, calendar) {
    const testrailID = 'C274651';
    const startDate = moment().startOf('week').add('1', 'day');
    const sharedFolderID = await I.haveFolder({
        module: 'event',
        subscribed: 1,
        title: testrailID,
        permissions: [
            { bits: 403710016, entity: users[0].userdata.id, group: false },
            { bits: 4227332, entity: users[1].userdata.id, group: false }
        ],
        parent: await calendar.defaultFolder()
    });
    // Login and create secret appointment in shared calendar
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.selectFolder(testrailID);
    calendar.newAppointment();
    I.fillField('Subject', testrailID);
    I.pressKey('Enter');
    await calendar.setDate('startDate', startDate);
    I.selectOption('Visibility', 'Secret');
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');
    // Check secret appointment in all views
    ['Workweek', 'Week', 'Day', 'Month'].forEach((view) => {
        calendar.switchView(view);
        if (view === 'Day') I.click(`.date-picker [aria-label*="${startDate.format('M/D/YYYY')}"]`);
        I.waitForElement('.page.current .private-flag');
    });
    I.logout();

    //Login user 2, check that secret appointment is not visible in shared calendar
    I.login(`app=io.ox/calendar&perspective="week"&folder=${sharedFolderID}`, { user: users[1] });
    calendar.waitForApp();
    I.waitForVisible({ css: `[title="${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: ${testrailID}"]` });
    I.dontSeeElement('.appointment');

});

Scenario('[C7414] Create two appointments at the same time (one is shown as free)', async function (I, users, calendar) {
    const testrailID = 'C7414';
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        startDate: { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') },
        attendees: [{ partStat: 'ACCEPTED', entity: users[1].userdata.id }]
    });
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.say('Create appointment');
    calendar.newAppointment();
    I.fillField('Subject', testrailID);
    I.fillField('Location', testrailID);
    I.click('Show as free');
    I.click('Create');

    I.say('Check conflicts dialog');
    I.waitForDetached(locate('.modal-open .modal-title').withText('Conflicts detected'));
});

Scenario('[C7415] Create two reserved appointments at the same time', async function (I, users, calendar, dialogs) {
    const testrailID = 'C7415';
    //Create Appointment
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        startDate: { tzid: 'Europe/Berlin', value: moment().startOf('day').add(10, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().startOf('day').add(12, 'hours').format('YYYYMMDD[T]HHmm00') },
        attendees: [{ partStat: 'ACCEPTED', entity: users[1].userdata.id }]
    });

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [title="' + testrailID + ', ' + testrailID + '"]');
    expect(await I.grabNumberOfVisibleElements(`.appointment-container [title="${testrailID}, ${testrailID}"]`)).to.equal(1);

    I.say('Create appointment');
    calendar.newAppointment();
    I.fillField('Subject', testrailID);
    I.fillField('Location', testrailID);
    I.fillField(calendar.locators.startdate, moment().startOf('day').format('MM/DD/YYYY'));
    I.clearField(calendar.locators.starttime);
    I.fillField(calendar.locators.starttime, moment().startOf('day').add(11, 'hours').format('HH:mm') + 'AM');
    I.click('Create');

    I.say('Check appointment');
    dialogs.waitForVisible();
    I.waitForText('Conflicts detected', 5, dialogs.locators.header);
    dialogs.clickButton('Ignore conflicts');
    I.waitForDetached('.modal-open');
    I.retry(5).click('~Refresh');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    I.seeNumberOfVisibleElements(`.appointment-container [title="${testrailID}, ${testrailID}"]`, 2);
});

Scenario('[C7446] Create recurring whole-day appointment', async function (I, calendar) {
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.clickToolbar('Today');

    I.say('Create appointment');
    calendar.newAppointment();
    I.fillField('Subject', 'Birthday of Linus Torvalds');
    I.fillField('Location', 'Helsinki Imbiss');
    I.checkOption('All day');
    await calendar.setDate('startDate', new moment('1969-12-28'));

    I.say('Create appointment > Recurrence');
    I.click(calendar.locators.repeat);
    I.click({ css: '.recurrence-view button.summary' });
    I.waitForElement(calendar.locators.recurrenceview, 5);
    I.selectOption('.recurrence-view-dialog [name="recurrence_type"]', 'Yearly');
    I.click('Apply');
    I.waitForDetached('.recurrence-view-dialog');
    I.click('Create');

    const selector = '.appointment-panel [aria-label*="Birthday of Linus Torvalds, Helsinki Imbiss"]';
    const list = ['1969-12-28', '1968-12-28', '1967-12-28', '1975-12-28', '1995-12-28', '2025-12-28'];
    await Promise.all(list.map(async (datestring) => {
        I.say(`Check ${datestring}`);
        await I.executeScript(`ox.ui.apps.get("io.ox/calendar").setDate(new moment("${datestring}"))`);
        I.waitForVisible(selector);
        expect(await I.grabNumberOfVisibleElements(selector)).to.equal(1);
    }));
});


Scenario('[C7447] Private appointment with participants', async (I, users, calendar) => {
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.clickToolbar('Today');

    I.say('Create appointment');
    calendar.newAppointment();
    I.fillField('Subject', 'Private appointment with participants');
    I.fillField('Location', 'PrivateRoom');
    I.fillField('input.add-participant.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.selectOption({ css: '[data-extension-id="private_flag"] select' }, 'Private');
    I.click('Create');
    I.waitForDetached(calendar.locators.edit);

    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment;
    ['Day', 'Week', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, (location) => {
        appointment = appointmentSelector.inside(location).as(`appointment element in ${perspective}`);
        I.waitForElement(appointment);
        I.seeElement(appointment.find(perspective === 'List' ?
            '.private-flag' :
            '.confidential-flag')
        );
    }));
});

Scenario('[C7448] Cannot create private appointment', async function (I, users, calendar) {
    const title = 'C7448';
    await I.haveFolder({
        title,
        permissions: [
            { entity: users[0].userdata.id, bits: 403710016, group: false },
            { user: users[1], access: 'author' }
        ],
        module: 'event',
        parent: await calendar.defaultFolder()
    });

    I.login('app=io.ox/calendar&perspective=week:week', { user: users[1] });
    calendar.waitForApp();
    I.clickToolbar('Today');

    // do a refresh, might mitigate a situation where the folder is not yet there
    I.say('Refresh');
    I.click('#io-ox-refresh-icon');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    I.say('Select shared calendar');
    I.waitForText('Shared calendars');
    I.selectFolder(title);

    I.say('Create appointment');
    I.clickToolbar('New appointment');
    I.waitForText('Appointments in shared calendars');
    I.click('On behalf of the owner');
    I.waitForElement('.io-ox-calendar-edit [name="summary"]');
    expect(await I.grabNumberOfVisibleElements('option[value="CONFIDENTIAL"]')).to.equal(0);
});

Scenario('[C234658] Create appointments and show this in cumulatively view', async (I, calendar) => {
    await I.haveSetting('io.ox/calendar//selectedFolders', {});
    const testrailID = 'C234658';
    const selector = '.appointment-container [title="C234658, C234658"]';
    await Promise.all([0, 1].map(async (i) => I.haveAppointment({
        folder: await I.haveFolder({ title: `${testrailID} - ${i}`, module: 'event', parent: await calendar.defaultFolder() }),
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        startDate: { tzid: 'Europe/Berlin', value: moment().startOf('day').add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate: { tzid: 'Europe/Berlin', value: moment().startOf('day').add(4, 'hours').format('YYYYMMDD[T]HHmm00') }
    })));

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();
    I.clickToolbar('Today');

    I.seeNumberOfVisibleElements(selector, 0);
    I.click({ css: `[data-id="virtual/flat/event/private"] [title="${testrailID} - 0"] .color-label` });
    I.waitNumberOfVisibleElements(selector, 1);
    I.click({ css: `[data-id="virtual/flat/event/private"] [title="${testrailID} - 1"] .color-label` });
    I.waitNumberOfVisibleElements('.appointment-container [title="C234658, C234658"]', 2);
});

Scenario('[C265153] Create appointment with a link in the description', async (I, calendar) => {
    const testrailID = 'C265153';
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testrailID,
        location: testrailID,
        description: 'https://www.google.de',
        startDate: { tzid: 'Europe/Berlin', value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00') }
    });
    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    I.waitForVisible({ css: '.io-ox-calendar-window' });
    I.clickToolbar('Today');
    I.waitForElement('.appointment-container [title="C265153, C265153"]');
    I.click('.appointment-container [title="C265153, C265153"]');
    I.waitForElement('.calendar-detail [href="https://www.google.de"]');
    I.click('.calendar-detail [href="https://www.google.de"]');
    I.retry(5).switchToNextTab();
    I.waitInUrl('https://www.google.de/', 5);
});

Scenario('Prevent XSS in folder dropdown', async (I, calendar, contacts) => {
    I.login('app=io.ox/mail');

    contacts.editMyContact();
    I.fillField('last_name', 'ayb"><img src=x onerror=alert(document.domain)>');
    I.click('Save');

    I.openApp('Calendar');
    calendar.waitForApp();
    calendar.newAppointment();
});

Scenario('[C7432] Create all-day appointment via doubleclick', async (I, calendar, dialogs) => {
    const appointmentPanel = '.io-ox-pagecontroller.current .appointment-panel';
    const subject = 'Meetup ';
    const location = 'Conference Room ';

    I.login('app=io.ox/calendar');

    ['Day', 'Week', 'Workweek'].forEach(perspective => calendar.withinPerspective(perspective, (viewName) => {
        I.waitForElement(appointmentPanel);
        I.doubleClick(appointmentPanel);
        I.waitForText('Create appointment');

        I.waitForElement(locate('.io-ox-calendar-edit-window'), 5);
        within('.io-ox-calendar-edit-window', () => {
            I.retry(5).fillField('Subject', subject + viewName);
            I.fillField('Location', location + viewName);
            I.click('Create');
        });
        I.waitForDetached('.window-container.io-ox-calendar-edit-window');

        I.waitForText(subject + viewName, 5, appointmentPanel);
        I.wait(0.5); // gentle wait for event listeners
        I.click('.appointment', '.page.current');
        I.waitForVisible('.io-ox-sidepopup');
        I.waitForText('Delete', 5, '.io-ox-sidepopup');
        I.wait(0.5); // gentle wait for event listeners
        I.click('Delete');
        dialogs.clickButton('Delete appointment');
    }));
});

// if "Mark all day appointments as free" is set the following behavior should be present:
// automatically mark new appointments as free when started as all day (click on a day)
// automatically mark new appointments free when switched to all day, should work both ways
// do not Show as free when editing
// do not Show as free when a user manually changed the checkbox (the user wants it set to that value obviously)
// do not Show as free when the setting is not set
Scenario('[OXUIB-244] Mark all day appointments as free not respected for new appointments', async (I, calendar) => {

    await I.haveSetting('io.ox/calendar//markFulltimeAppointmentsAsFree', true);

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    // start as all day appointment
    I.waitForElement('.io-ox-pagecontroller.current .appointment-panel');
    I.doubleClick('.io-ox-pagecontroller.current .appointment-panel');
    I.waitForText('Create appointment');

    I.waitForElement(locate('.io-ox-calendar-edit-window'), 5);

    I.seeCheckboxIsChecked('All day');
    I.seeCheckboxIsChecked('Show as free');

    I.fillField('Subject', 'test appointment');
    I.click('Create');
    I.waitForDetached('.window-container.io-ox-calendar-edit-window');
    I.waitForText('test appointment');

    // visibility should not be changed in edit mode
    I.waitForText('test appointment', 5, '.io-ox-pagecontroller.current .appointment-panel');
    I.click('.appointment', '.page.current');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForText('Edit', 5, '.io-ox-sidepopup');
    I.click('Edit');

    I.waitForText('All day', 5);

    I.uncheckOption('All day');

    I.dontSeeCheckboxIsChecked('All day');
    I.seeCheckboxIsChecked('Show as free');

    I.click('Save');
    I.waitForDetached('.window-container.io-ox-calendar-edit-window');

    // check switching all day on and off
    calendar.newAppointment();

    I.dontSeeCheckboxIsChecked('All day');
    I.dontSeeCheckboxIsChecked('Show as free');

    I.checkOption('All day');

    I.seeCheckboxIsChecked('All day');
    I.seeCheckboxIsChecked('Show as free');

    I.uncheckOption('All day');

    I.dontSeeCheckboxIsChecked('All day');
    I.dontSeeCheckboxIsChecked('Show as free');

    // user interaction
    I.checkOption('Show as free');

    I.checkOption('All day');

    I.seeCheckboxIsChecked('All day');
    I.seeCheckboxIsChecked('Show as free');

    I.uncheckOption('All day');

    I.dontSeeCheckboxIsChecked('All day');
    // should stay the way the user manually set it to
    I.seeCheckboxIsChecked('Show as free');

    I.uncheckOption('Show as free');

    I.checkOption('All day');

    I.seeCheckboxIsChecked('All day');
    // should stay the way the user manually set it to
    I.dontSeeCheckboxIsChecked('Show as free');

    I.logout();

    // if setting is disabled no automatic should happen
    await I.haveSetting('io.ox/calendar//markFulltimeAppointmentsAsFree', false);

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    // check switching all day on and off
    calendar.newAppointment();

    I.dontSeeCheckboxIsChecked('All day');
    I.dontSeeCheckboxIsChecked('Show as free');

    I.checkOption('All day');

    I.seeCheckboxIsChecked('All day');
    I.dontSeeCheckboxIsChecked('Show as free');
});

Scenario('[C7435] Create appointment via email', async function (I, mail, users, calendar) {
    await Promise.all([
        users.create(),
        users.create()
    ]);

    const day = moment().add(1, 'month').startOf('month').add(1, 'week').isoWeekday(2).format('M/D/YYYY'), // tuesday within next month for a stable clickable future appointment
        calendarDay = `//td[contains(@aria-label, "${day}")]`,
        title = 'Appointment via mail';

    await session('Alice', async () => {
        await I.haveMail({
            attachments: [{
                content: 'Hello world!',
                content_type: 'text/html',
                disp: 'inline'
            }],
            from: [[users[0].get('display_name'), users[0].get('primaryEmail')]],
            sendtype: 0,
            subject: title,
            to: [[users[0].get('display_name'), users[0].get('primaryEmail')]],
            cc: [[users[1].get('display_name'), users[1].get('primaryEmail')],
                [users[2].get('display_name'), users[2].get('primaryEmail')]]
        }, { user: users[0] });

        I.login('app=io.ox/mail');
        mail.waitForApp();
        mail.selectMail('Appointment via mail');
        I.waitForVisible('.mail-detail-pane .dropdown-toggle[aria-label="More actions"]');
        I.click('~More actions', '.mail-detail-pane');
        I.clickDropdown('Invite to appointment');

        I.waitForElement('.io-ox-calendar-edit-window');
        within('.io-ox-calendar-edit-window', async () => {
            I.waitForText(title);
            I.retry(5).fillField('Location', 'Conference Room 123');
            I.click('.datepicker-day-field');
            I.waitForFocus('.datepicker-day-field');
            I.fillField(calendar.locators.startdate, day);
            I.pressKey('Enter');
            I.clearField(calendar.locators.starttime);
            I.fillField(calendar.locators.starttime, '01:00 PM');
            I.pressKey('Enter');
            I.clearField(calendar.locators.endtime);
            I.fillField(calendar.locators.endtime, '03:00 PM');
            I.pressKey('Enter');
            I.click('Create');
        });
        I.waitForDetached('.io-ox-calendar-edit-window');

        I.openApp('Calendar');

        I.waitForElement('~Go to next month', calendar.locators.mini);
        I.retry(5).click('~Go to next month', calendar.locators.mini);
        I.retry(5).click(calendarDay, calendar.locators.mini);
        ['Day', 'Week', 'Workweek', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, () => {
            I.waitForText(title, 5, '.page.current .appointment');
        }));
    });


    await session('Bob', () => {
        I.login('app=io.ox/calendar', { user: users[1] });
        calendar.waitForApp();
        I.waitForElement('~Go to next month', calendar.locators.mini);
        I.retry(5).click('~Go to next month', calendar.locators.mini);
        I.retry(5).click(calendarDay, calendar.locators.mini);
        ['Day', 'Week', 'Workweek', 'Month', 'List'].forEach(perspective => calendar.withinPerspective(perspective, () => {
            I.waitForText(title, 5, '.page.current .appointment');
        }));
    });
});

