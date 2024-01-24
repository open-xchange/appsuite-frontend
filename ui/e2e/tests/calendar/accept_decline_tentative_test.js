/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

const moment = require('moment');

Feature('Calendar > Create');

Before(async function ({ I, users }) {
    await Promise.all([
        users.create(),
        users.create(),
        users.create(),
        users.create()
    ]);
    await Promise.all(users.map(user => I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user })));
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: very shaky
Scenario.skip('Create appointments with participants who will accept/decline/accept tentative', async function ({ I, users, calendar, dialogs }) {
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'test invite accept/decline/accept tentative',
        startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) },
        attendees: users.map(user => { return { entity: user.userdata.id }; })
    });

    I.say('User 1');
    I.login('app=io.ox/calendar&perspective=list', { user: users[1] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    I.say('Accept');
    I.waitForText('test invite accept/decline/accept tentative', 5, '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');
    dialogs.waitForVisible();
    dialogs.clickButton('Accept');
    I.waitForDetached('.modal-dialog', 5);
    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');
    I.logout();

    I.say('User 2');
    I.login('app=io.ox/calendar&perspective=list', { user: users[2] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    I.say('Decline');
    I.waitForText('test invite accept/decline/accept tentative', 5, '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');
    I.waitForVisible({ css: '[data-action="io.ox/calendar/detail/actions/changestatus"]' });
    I.click('Change status');
    dialogs.waitForVisible();
    dialogs.clickButton('Decline');
    I.waitForDetached('.modal-dialog', 5);
    I.waitForElement('.rightside .participant a.declined[title="' + users[2].userdata.primaryEmail + '"]');
    I.logout();

    I.say('User 3');
    I.login('app=io.ox/calendar&perspective=list', { user: users[3] });
    calendar.waitForApp();
    I.selectFolder('Calendar');

    I.say('Tentative');
    I.waitForText('test invite accept/decline/accept tentative', 5, '.list-view .appointment .title');
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
    I.waitForText('test invite accept/decline/accept tentative', 5, '.list-view .appointment .title');
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
