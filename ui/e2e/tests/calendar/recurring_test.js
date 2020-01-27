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

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create recurring appointments with one participant', async function (I, users, calendar) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const startDate = moment().startOf('week').add('days', 1);
    I.say(startDate.format('MM/DD/YYYY'));
    I.login('app=io.ox/calendar&perspective=list');
    calendar.waitForApp();

    I.selectFolder('Calendar');
    calendar.newAppointment();

    I.fillField('Subject', 'test recurring');
    I.fillField('Location', 'invite location');
    calendar.setDate('startDate', startDate);
    I.click('~Start time');
    I.click('4:00 PM');

    I.click('Repeat', '.io-ox-calendar-edit-window');
    I.click('Every Monday.');

    I.waitForElement('.modal-dialog');

    I.selectOption('.modal-dialog [name="recurrence_type"]', 'Daily');
    I.selectOption('.modal-dialog [name="until"]', 'After a number of occurrences');
    I.waitForElement('.modal-dialog [name="occurrences"]');
    I.fillField('.modal-dialog [name="occurrences"]', '5');

    I.pressKey('Enter');
    I.click('Apply', '.modal-dialog');

    I.waitForDetached('.modal-dialog');

    // add user 1
    I.fillField('input.add-participant.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForText('test recurring', 5, calendar.locators.listview);
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

    I.selectFolder('Calendar');

    I.waitForText('test recurring', 5, calendar.locators.listview);
    I.seeNumberOfElements('.list-view .appointment .title', 5);

    I.click('test recurring', '.list-view .list-item .title');

    I.waitForDetached('.rightside .multi-selection-message');
    I.waitForText('test recurring', 5, '.rightside');
    I.waitForText('invite location', 5, '.rightside');

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');

    I.waitForElement('.modal-dialog');
    I.click('Change series', '.modal-dialog');
    I.wait(0.2);
    I.click('Accept', '.modal-dialog');

    I.waitForDetached('.modal-dialog', 5);

    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');

    I.logout();

    // login owner
    I.login('app=io.ox/calendar&perspective=list');
    calendar.waitForApp();

    I.selectFolder('Calendar');

    I.waitForText('test recurring', 5, '.list-view .appointment:nth-child(5) .title');
    I.click('test recurring', '.list-view .list-item:nth-child(5) .title');

    // owner
    I.waitForElement('.rightside .participant a.accepted[title="' + users[0].userdata.primaryEmail + '"]');
    // accepted
    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');

    // edit
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForVisible('.modal-dialog');
    I.click('Cancel', '.modal-dialog');

    // TODO: Needs a fix. "All future appointments" is wrong since apppointment has flag "first_occurence"
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.waitForVisible('.modal-dialog');
    I.click('Edit all future appointments', '.modal-dialog');

    I.waitForVisible('.io-ox-calendar-edit-window');
    I.fillField('Subject', 'test recurring edit');
    I.fillField('Location', 'invite location edit');
    I.click('Save', '.io-ox-calendar-edit-window');

    I.waitForText('test recurring edit', 5, calendar.locators.listview);
    I.seeNumberOfElements('.list-view .appointment .title', 5);

    // edit
    I.waitForText('test recurring edit', 5, calendar.locators.listview);

    I.click({ xpath: '//div[text()="test recurring edit"]' });

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });

    I.waitForVisible('.modal-dialog');
    I.click('Edit this appointment', '.modal-dialog');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test recurring edit new');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.waitForVisible(locate('.title').withText('test recurring edit new').inside('.list-view-control'));
    I.seeNumberOfElements(locate('.title').withText('test recurring edit new').inside('.list-view-control'), 1);

    I.click(locate('.title').withText('test recurring edit new').inside('.list-view-control'));
    //edit exeption
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/edit"]' });

    I.waitForVisible('.modal-dialog');
    I.click('Edit this appointment', '.modal-dialog');

    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test recurring edit new edit');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.seeNumberOfElements(locate('.title').withText('test recurring edit new edit').inside('.list-view-control'), 1);
    I.click(locate('.title').withText('test recurring edit new edit').inside('.list-view-control'));

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/delete"]' });
    I.click({ css: '[data-action="io.ox/calendar/detail/actions/delete"]' });

    I.waitForVisible('.modal-dialog');
    I.click('Delete this appointment', '.modal-dialog');

    I.waitForDetached('.modal-dialog');
    I.waitForVisible(locate('.title').withText('test recurring edit').inside('.list-view-control'));
    I.seeNumberOfElements(locate('.title').withText('test recurring edit').inside('.list-view-control'), 3);


    // check in Month view

    ['Month', 'Week', 'Workweek'].forEach(function (view) {
        calendar.withinPerspective(view, function (perspective) {
            I.say(perspective);
            I.click({ css: `.date-picker td[aria-label*="${startDate.format('M/DD/YYYY')}"]` });
            I.waitForVisible(locate('.appointment .title').inside(perspective).withText('test recurring edit'));
            I.seeNumberOfElements(locate({ css: '.appointment' }).inside(perspective).withText('test recurring edit'), 3);
        });
    });

    I.logout();

    // login new user1 for decline
    I.login('app=io.ox/calendar&perspective=list', { user: users[1] });
    calendar.waitForApp();

    I.selectFolder('Calendar');

    I.waitForText('test recurring edit', 5, calendar.locators.listview);
    I.seeNumberOfElements('.list-view .appointment .title', 4);

    I.click(locate('.list-item.appointment').withText('test recurring edit'));

    I.waitForDetached('.rightside .multi-selection-message');
    I.see('test recurring edit', '.rightside');
    I.see('invite location', '.rightside');

    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');

    I.waitForVisible('.modal-dialog');

    I.click('Change series', '.modal-dialog');

    I.click('Decline', '.modal-dialog');

    I.waitForDetached('.modal-dialog', 5);

    I.waitForElement('.rightside .participant a.declined[title="' + users[1].userdata.primaryEmail + '"]');
    I.seeNumberOfElements('.list-view .appointment .declined', 3);

    I.click(locate('.list-item.appointment').withText('test recurring edit'));
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');

    I.waitForVisible('.modal-dialog');
    I.click('Change appointment', '.modal-dialog');
    I.waitForVisible('.modal-dialog [data-action="tentative"]');
    I.click('Tentative', '.modal-dialog');

    I.waitForDetached('.modal-dialog', 5);
    I.waitForVisible('.list-view .appointment');
    I.seeNumberOfElements('.list-view .appointment .tentative', 1);
    I.seeNumberOfElements('.list-view .appointment .declined', 2);
});
