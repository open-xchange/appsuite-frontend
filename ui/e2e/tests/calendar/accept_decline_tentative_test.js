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

Scenario('Create appointments with participants who will accept/decline/accept tentative', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
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

    // user 1
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[1] });

    // login new user1 for accept
    I.login('app=io.ox/calendar', { user: users[1] });
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder('Calendar');

    I.clickToolbar('View');
    I.click('List');

    I.see('test invite accept/decline/accept tentative', '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');

    I.waitForVisible('[data-action="io.ox/calendar/detail/actions/changestatus"]');
    I.click('Change status');
    I.waitForElement('.modal-dialog');

    I.click('Accept', '.modal-dialog');

    I.waitForDetached('.modal-dialog', 5);

    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');

    I.logout();

    // user 2
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[2] });

    // login new user2 for decline
    I.login('app=io.ox/calendar', { user: users[2] });
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder('Calendar');

    I.clickToolbar('View');
    I.click('List');

    I.see('test invite accept/decline/accept tentative', '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');

    I.waitForVisible('[data-action="io.ox/calendar/detail/actions/changestatus"]');
    I.click('Change status');
    I.waitForElement('.modal-dialog');

    I.click('Decline', '.modal-dialog');

    I.waitForDetached('.modal-dialog', 5);

    I.waitForElement('.rightside .participant a.declined[title="' + users[2].userdata.primaryEmail + '"]');

    I.logout();

    // user 3
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    }, { user: users[3] });

    // login new user3 for accept tentative
    I.login('app=io.ox/calendar', { user: users[3] });
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder('Calendar');

    I.clickToolbar('View');
    I.click('List');

    I.see('test invite accept/decline/accept tentative', '.list-view .appointment .title');
    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');

    I.waitForVisible('[data-action="io.ox/calendar/detail/actions/changestatus"]');
    I.click('Change status');
    I.waitForElement('.modal-dialog');

    I.click('Tentative', '.modal-dialog');

    I.waitForDetached('.modal-dialog', 5);

    I.waitForElement('.rightside .participant a.tentative[title="' + users[3].userdata.primaryEmail + '"]');

    I.logout();

    // login owner
    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List');

    // check in list view
    I.clickToolbar('View');
    I.click('List');
    I.see('test invite accept/decline/accept tentative', '.list-view .appointment .title');

    I.click('test invite accept/decline/accept tentative', '.list-view .list-item .title');

    // owner
    I.waitForElement('.rightside .participant a.accepted[title="' + users[0].userdata.primaryEmail + '"]');
    // accepted
    I.waitForElement('.rightside .participant a.accepted[title="' + users[1].userdata.primaryEmail + '"]');
    // declined
    I.waitForElement('.rightside .participant a.declined[title="' + users[2].userdata.primaryEmail + '"]');
    // accept tentative
    I.waitForElement('.rightside .participant a.tentative[title="' + users[3].userdata.primaryEmail + '"]');

    I.logout();

});
