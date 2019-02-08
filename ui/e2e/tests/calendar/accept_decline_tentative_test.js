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

Feature('Calendar: Create appointment').tag('2');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointments with participants who will accept/decline/accept tentative', function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    // create in list view for invitation accept
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('List');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test invite accept/decline/accept tentative');
    I.fillField('Location', 'invite location');

    I.click('~Start time');
    I.click('4:00 PM');

    // add user 1
    I.fillField('Add contact/resource', users[1].userdata.primaryEmail);
    I.pressKey('Enter');

    // add user 2
    I.fillField('Add contact/resource', users[2].userdata.primaryEmail);
    I.pressKey('Enter');

    // add user 3
    I.fillField('Add contact/resource', users[3].userdata.primaryEmail);
    I.pressKey('Enter');

    I.see(users[0].userdata.primaryEmail, '.participant-wrapper');
    I.see(users[1].userdata.primaryEmail, '.participant-wrapper.removable');
    I.see(users[2].userdata.primaryEmail, '.participant-wrapper.removable');
    I.see(users[3].userdata.primaryEmail, '.participant-wrapper.removable');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in list view
    I.clickToolbar('View');
    I.click('List');
    I.see('test invite accept/decline/accept tentative', '.list-view .appointment .title');

    I.logout();

    // user 1
    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[1] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[1] });
    I.haveSetting('io.ox/calendar//showCheckboxes', true, { user: users[1] });

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

    // reset settings
    I.haveSetting('io.ox/core//autoOpenNotification', true, { user: users[1] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[1] });
    I.haveSetting('io.ox/calendar//showCheckboxes', false, { user: users[1] });

    // user 2
    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[2] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[2] });
    I.haveSetting('io.ox/calendar//showCheckboxes', true, { user: users[2] });

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

    // reset settings
    I.haveSetting('io.ox/core//autoOpenNotification', true, { user: users[2] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[2] });
    I.haveSetting('io.ox/calendar//showCheckboxes', false, { user: users[2] });


    // user 3
    I.haveSetting('io.ox/core//autoOpenNotification', false, { user: users[3] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[3] });
    I.haveSetting('io.ox/calendar//showCheckboxes', true, { user: users[3] });

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

    // reset settings
    I.haveSetting('io.ox/core//autoOpenNotification', true, { user: users[3] });
    I.haveSetting('io.ox/core//showDesktopNotifications', false, { user: users[3] });
    I.haveSetting('io.ox/calendar//showCheckboxes', false, { user: users[3] });

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
