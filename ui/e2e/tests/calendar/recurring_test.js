/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

const moment = require('moment');

Feature('Calendar > Create');

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Create recurring appointments with one participant', async function ({ I, users, calendar, dialogs }) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const startDate = moment().add(1, 'months').startOf('week').add(1, 'days');

    I.login('app=io.ox/calendar&perspective=list');
    calendar.waitForApp();
    calendar.newAppointment();

    I.fillField('Subject', 'test recurring');
    I.fillField('Location', 'invite location');
    calendar.setDate('startDate', startDate);
    I.click('~Start time');
    I.click('4:00 PM');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    dialogs.waitForVisible();
    I.waitForText('Edit recurrence', 5, dialogs.locators.header);

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');
    I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
    I.waitForElement('.modal-dialog [name="occurrences"]');
    I.fillField('.modal-dialog [name="occurrences"]', '5');

    I.pressKey('Enter');
    dialogs.clickButton('Apply');
    I.waitForDetached('.modal-dialog');

    // add user 1
    I.fillField('input.add-participant.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForText('Load appointments until', 5, calendar.locators.listview);
    I.click('Load appointments until');
    I.waitForVisible(locate('.appointment').withText('test recurring').inside('.list-view').at(5).as('Appointment 5'));
    I.seeNumberOfElements('.list-view .appointment .title', 5);

    I.logout();

    // user 1
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[1] });

    // login new user1 for accept
    I.login('app=io.ox/calendar&perspective=list', { user: users[1] });
    calendar.waitForApp();

    I.waitForText('Load appointments until', 5, calendar.locators.listview);
    I.click('Load appointments until');
    I.waitForVisible(locate('.appointment').withText('test recurring').inside('.list-view').at(5).as('Appointment 5'));
    I.seeNumberOfElements('.list-view .appointment .title', 5);
    I.wait(0.2);
    I.retry(5).click(locate('.appointment').withText('test recurring').inside('.list-view').at(1).as('Appointment'));

    I.waitForDetached('.rightside .multi-selection-message');
    I.waitForText('test recurring', 5, '.rightside');
    I.waitForText('invite location', 5, '.rightside');

    I.clickToolbar({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });

    dialogs.waitForVisible();
    dialogs.clickButton('Change series');
    I.waitForText('Change confirmation status', 5, dialogs.locators.header);
    dialogs.clickButton('Accept');
    I.waitForDetached('.modal-dialog');

    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');

    I.logout();

    // login owner
    I.login('app=io.ox/calendar&perspective=list');
    calendar.waitForApp();

    I.waitForText('Load appointments until', 5, calendar.locators.listview);
    I.click('Load appointments until');
    I.waitForText('test recurring', 5, locate('.appointment').inside('.list-view').at(2).as('Appointment 3'));
    I.retry(5).click(locate('.appointment').withText('test recurring').inside('.list-view').at(2).as('Appointment 3'));

    // owner
    I.waitForElement('.rightside .participant a.accepted[title="' + users[0].userdata.primaryEmail + '"]');
    // accepted
    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');

    // edit
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });

    dialogs.waitForVisible();
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    // TODO: Needs a fix. "All future appointments" is wrong since apppointment has flag "first_occurence"
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    dialogs.waitForVisible();
    dialogs.clickButton('Edit all future appointments');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).fillField('Subject', 'test recurring edit');
    I.fillField('Location', 'invite location edit');
    I.click('Save', '.io-ox-calendar-edit-window');

    I.waitForText('test recurring edit', 5, calendar.locators.listview);
    I.seeNumberOfElements('.list-view .appointment .title', 5);

    // edit
    I.waitForText('test recurring edit', 5, calendar.locators.listview);

    I.retry(5).click({ xpath: '//div[text()="test recurring edit"]' });

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });

    dialogs.waitForVisible();
    dialogs.clickButton('Edit this appointment');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'test recurring edit new');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.waitForVisible(locate('.title').withText('test recurring edit new').inside('.list-view-control'));
    I.seeNumberOfElements(locate('.title').withText('test recurring edit new').inside('.list-view-control'), 1);

    I.click(locate('.title').withText('test recurring edit new').inside('.list-view-control'));
    //edit exeption
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });

    dialogs.waitForVisible();
    dialogs.clickButton('Edit this appointment');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'test recurring edit new edit');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.seeNumberOfElements(locate('.title').withText('test recurring edit new edit').inside('.list-view-control'), 1);
    I.retry(5).click(locate('.title').withText('test recurring edit new edit').inside('.list-view-control'));

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/delete"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/delete"]' });

    dialogs.waitForVisible();
    dialogs.clickButton('Delete this appointment');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible(locate('.title').withText('test recurring edit').inside('.list-view-control'));
    I.seeNumberOfElements(locate('.title').withText('test recurring edit').inside('.list-view-control'), 3);


    // check in Month view
    I.click(locate('.btn-next').inside('.date-picker'));
    I.click({ css: `.date-picker td[aria-label*="${startDate.format('M/D/YYYY')}"]` });
    ['Month', 'Week', 'Workweek'].forEach(function (view) {
        calendar.withinPerspective(view, function (perspective) {
            I.say(perspective);
            //I.click({ css: `.date-picker td[aria-label*="${startDate.format('M/DD/YYYY')}"]` });
            I.waitForVisible(locate('.appointment .title').inside(perspective).withText('test recurring edit'));
            I.seeNumberOfElements(locate({ css: '.appointment' }).inside(perspective).withText('test recurring edit'), 3);
        });
    });

    I.logout();

    // login new user1 for decline
    I.login('app=io.ox/calendar&perspective=list', { user: users[1] });
    calendar.waitForApp();

    I.waitForText('Load appointments until', 5, calendar.locators.listview);
    I.click('Load appointments until');
    I.waitForText('test recurring edit', 5, calendar.locators.listview);
    I.seeNumberOfElements('.list-view .appointment .title', 4);

    I.retry(5).click(locate('.list-item.appointment').withText('test recurring edit'));

    I.waitForDetached('.rightside .multi-selection-message');
    I.see('test recurring edit', '.rightside');
    I.see('invite location', '.rightside');

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');

    dialogs.waitForVisible();
    dialogs.clickButton('Change series');
    I.waitForText('Change confirmation status', 5, dialogs.locators.header);
    dialogs.clickButton('Decline');
    I.waitForDetached('.modal-dialog', 5);

    I.waitForElement('.rightside .participant a.declined[title="' + users[1].userdata.primaryEmail + '"]');
    I.seeNumberOfElements('.list-view .appointment .declined', 3);

    I.retry(5).click(locate('.list-item.appointment').withText('test recurring edit'));
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');

    dialogs.waitForVisible();
    dialogs.clickButton('Change appointment');
    I.waitForText('Change confirmation status', 5, dialogs.locators.header);
    dialogs.clickButton('Tentative');

    I.waitForDetached('.modal-dialog', 5);
    I.waitForVisible('.list-view .appointment');
    I.seeNumberOfElements('.list-view .appointment .tentative', 1);
    I.seeNumberOfElements('.list-view .appointment .declined', 2);
});


Scenario('[Bug 63392][OXUIB-212] Recurring appointment can\'t changed to "Never ends"', async function ({ I, calendar, dialogs }) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');
    // start tomorrow
    var startDate = moment().startOf('day').add(1, 'day');

    var appointment = await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'Install more rgb to improve fps',
        attendeePrivileges: 'DEFAULT',
        rrule: 'FREQ=DAILY;COUNT=3',
        startDate: {
            value: startDate.format('YYYYMMDD')
        },
        endDate: {
            value: startDate.add(1, 'day').format('YYYYMMDD')
        }
    });

    // startDate of master is recurrenceId for the first occurence
    var cid = appointment.folder + '.' + appointment.id + '.' + appointment.startDate.value;

    I.login('app=io.ox/calendar&perspective=list');
    calendar.waitForApp();
    I.waitForVisible('li.list-item.selectable.appointment[data-cid="' + cid + '"]');
    I.click({ css: 'li.list-item.selectable.appointment[data-cid="' + cid + '"]' });

    // same as new appointment helper, make sure toolbar switched to new selection
    I.wait(1);
    I.click('Edit');
    dialogs.waitForVisible();
    dialogs.clickButton('Edit series');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');

    // change recurrence to never ending
    I.click('Every day. The series ends after 3 occurences.');
    dialogs.waitForVisible();
    I.selectOption('Ends', 'Never');
    dialogs.clickButton('Apply');

    I.waitForInvisible('.modal-dialog');
    I.click('Save');
    // no backend error should happen here
    I.waitForDetached('.io-ox-tasks-edit-window');
    // must use xpath here since waitForText does not check if the elements text fully matches the string
    // we are looking for just 'Every day.' and not 'Every day. The series ends after 3 occurences.'
    I.waitForElement({ xpath: '//div[contains(@class, "calendar-detail")]//div[@class="recurrence"][text()="Every day."]' });
});
