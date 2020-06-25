/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <chrsitoph.kopp@open-xchange.com>
 */

const moment = require('moment');

Feature('Calendar > Create');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointments with participants who will accept/decline/accept tentative', async function (I, users, calendar, dialogs) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    const usersettings = {
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    };
    await I.haveAppointment({
        folder: folder,
        summary: 'test invite accept/decline/accept tentative',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' },
        attendees: [{
            entity: users[0].userdata.id
        }, {
            entity: users[1].userdata.id
        }, {
            entity: users[2].userdata.id
        }, {
            entity: users[3].userdata.id
        }]
    });

    I.say('User 1');
    await I.haveSetting(usersettings, { user: users[1] });
    I.login('app=io.ox/calendar&perspective=list', { user: users[1] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    I.say('Accept');
    I.waitForText('test invite accept/decline/accept tentative', 10, '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');
    dialogs.waitForVisible();
    dialogs.clickButton('Accept');
    I.waitForDetached('.modal-dialog', 5);
    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');
    I.logout();

    I.say('User 2');
    await I.haveSetting(usersettings, { user: users[2] });
    I.login('app=io.ox/calendar&perspective=list', { user: users[2] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    I.say('Decline');
    I.waitForText('test invite accept/decline/accept tentative', 10, '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');
    dialogs.waitForVisible();
    dialogs.clickButton('Decline');
    I.waitForDetached('.modal-dialog', 5);
    I.waitForElement('.rightside .participant a.declined[title="' + users[2].userdata.primaryEmail + '"]');
    I.logout();

    I.say('User 3');
    await I.haveSetting(usersettings, { user: users[3] });
    I.login('app=io.ox/calendar&perspective=list', { user: users[3] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    I.say('Tentative');
    I.waitForText('test invite accept/decline/accept tentative', 10, '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');
    dialogs.waitForVisible();
    dialogs.clickButton('Tentative');
    I.waitForDetached('.modal-dialog', 5);
    I.waitForElement('.rightside .participant a.tentative[title="' + users[3].userdata.primaryEmail + '"]');
    I.logout();

    I.say('Owner');
    I.login('app=io.ox/calendar&perspective=list', { user: users[0] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    // check in list view
    I.say('Check list view');
    I.waitForText('test invite accept/decline/accept tentative', 10, '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');
    // owner
    I.waitForElement('.rightside .participant a.accepted[title="' + users[0].userdata.primaryEmail + '"]');
    // accepted
    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');
    // declined
    I.waitForElement('.rightside .participant a.declined[title="' + users[2].userdata.primaryEmail + '"]');
    // accept tentative
    I.waitForElement('.rightside .participant a.tentative[title="' + users[3].userdata.primaryEmail + '"]');
});
