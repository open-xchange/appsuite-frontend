/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect,
    moment = require('moment'),
    _ = require('underscore');

Feature('Calendar');

Before(async ({ I, users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('xyz [C274410] Subscribe shared Calendar and [C274410] Unsubscribe shared Calendar', async function ({ I, users, calendar, dialogs }) {
    const sharedCalendarName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New calendar`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: await calendar.defaultFolder() });

    // share folder for preconditions
    // TODO should be part of the haveFolder helper
    I.login('app=io.ox/calendar&cap=caldav');
    calendar.waitForApp();

    I.waitForText('New calendar');
    I.rightClick({ css: '[aria-label^="New calendar"]' });
    I.waitForText('Share / Permissions');
    I.wait(0.2); // Just wait a little extra for all event listeners
    I.click('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForText('Permissions for calendar "New calendar"');
    I.fillField('.modal-dialog .tt-input', users[1].userdata.primaryEmail);
    I.waitForText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, undefined, '.tt-dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    dialogs.clickButton('Save');
    I.waitForDetached('.share-permissions-dialog .modal-dialog');

    I.logout();

    I.login('app=io.ox/calendar&cap=caldav', { user: users[1] });

    I.retry(5).doubleClick('~Shared calendars');
    I.waitForText(sharedCalendarName);

    I.retry(5).click('Add new calendar');

    I.click('Subscribe to shared calendar');

    dialogs.waitForVisible();
    I.waitForText('Subscribe to shared calendars');

    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find('.checkbox'));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForInvisible(locate('*').withText(sharedCalendarName));

    I.click('Add new calendar');
    I.click('Subscribe to shared calendar');

    dialogs.waitForVisible();
    I.waitForText('Subscribe to shared calendars');

    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find('.checkbox'));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedCalendarName)).find({ css: 'label' }).withText('Sync via DAV'));

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText(sharedCalendarName);
});

Scenario('xyz Manage public Calendars', async function ({ I, users, calendar, dialogs }) {
    const publicCalendarName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New public`;

    I.login('app=io.ox/calendar&cap=caldav');
    calendar.waitForApp();
    // create public calendar
    I.say('Create public calendar');
    I.waitForText('Add new calendar', 5, '.folder-tree');
    I.click('Add new calendar', '.folder-tree');

    I.clickDropdown('Personal calendar');

    dialogs.waitForVisible();
    I.fillField('input[placeholder="New calendar"]', publicCalendarName);
    I.waitForText('Add as public calendar', 5, dialogs.locators.body);
    I.checkOption('Add as public calendar', dialogs.locators.body);
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('~Public calendars');
    I.click('.fa.fa-caret-right', '~Public calendars');

    I.waitForText(publicCalendarName);
    I.rightClick({ css: '[aria-label^="' + publicCalendarName + '"]' });
    I.wait(0.2);
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForElement('.form-control.tt-input', 5, dialogs.locators.header);

    await within('.modal-dialog', () => {
        I.waitForFocus('.tt-input');
        I.fillField('.tt-input[placeholder="Name or email address"]', 'All users');
        I.waitForVisible(locate('.tt-dropdown-menu').withText('All users'));
        I.pressKey('Enter');
        I.waitForVisible(locate('.permissions-view .row').withText('All users'));
    });

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.logout();

    I.login('app=io.ox/calendar&cap=caldav', { user: users[1] });

    I.retry(5).doubleClick('~Public calendars');
    I.waitForText(publicCalendarName);

    I.retry(5).click('Add new calendar');
    I.click('Subscribe to shared calendar');

    dialogs.waitForVisible();
    I.waitForText('Subscribe to shared calendars');

    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(publicCalendarName)).find({ css: 'input[name="subscribed"]' }));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(publicCalendarName)).find({ css: 'input[name="used_for_sync"]' }));

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    I.logout();

    // cleanup
    I.login('app=io.ox/calendar&cap=caldav');
    calendar.waitForApp();

    // remove public calendar
    I.waitForText(publicCalendarName);
    I.rightClick({ css: '[aria-label^="' + publicCalendarName + '"]' });

    I.wait(0.2);
    I.clickDropdown('Delete');
    dialogs.waitForVisible();
    I.waitForElement('[data-action="delete"]', 5, dialogs.locators.body);
    dialogs.clickButton('Delete');
});
