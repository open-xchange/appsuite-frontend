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

Feature('Calendar: Create appointment').tag('3');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointments in multiple calendars', function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.clickToolbar('View');
    I.click('Workweek');

    I.click('.page.current button[aria-label="Next Week"]');

    // create new Calendar
    I.waitForVisible('.window-sidepanel [data-action="add-subfolder"]');
    I.click('Add new calendar', '.window-sidepanel');
    I.click('Personal calendar', '.smart-dropdown-container .dropdown-menu');

    I.waitForVisible('.modal-dialog');
    I.click('Add', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForText('New calendar', '.window-sidepanel');

    // select new calendar
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label');

    // create in Workweek view
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');
    I.see('test appointment one', '.workweek .appointment .title');

    I.seeNumberOfElements('.workweek .appointment .title', 1);

    // create second appointment in different calendar
    I.selectFolder('New calendar');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see('New calendar', '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('5:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');
    I.waitForText('test appointment two', 5, '.workweek');
    I.see('test appointment one', '.workweek .appointment .title');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.seeNumberOfElements('.workweek .appointment .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    // remove appointments
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    I.click('test appointment two', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // create in Week view
    I.selectFolder('New calendar');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('View');
    I.click('Week');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see('New calendar', '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');
    I.click('~Start time');
    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // create second appointment in different calendar
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('5:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Week view
    I.clickToolbar('View');
    I.click('Week');
    I.waitForText('test appointment one', 5, '.week');
    I.waitForText('test appointment two', 5, '.week');
    I.see('test appointment one', '.weekview-container.week .appointment .title');
    I.see('test appointment two', '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.seeNumberOfElements('.weekview-container.week .appointment .appointment-content .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment one', '.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .appointment-content .title', 2);

    // remove
    I.click('test appointment one', '.weekview-container.week  .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    I.click('test appointment two', '.weekview-container.week  .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // create in Month view
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label');
    I.clickToolbar('View');
    I.click('Month');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');
    I.click('~Start time');
    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    // create second appointment in different calendar
    I.selectFolder('New calendar');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see('New calendar', '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('5:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Month view
    I.clickToolbar('View');
    I.click('Month');
    I.waitForText('test appointment one', 5, '.month-container');
    I.waitForText('test appointment two', 5, '.month-container');
    I.see('test appointment one', '.month-container .appointment .title');
    I.see('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.seeNumberOfElements('.month-container .appointment .appointment-content .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .appointment-content .title', 2);

    // remove
    I.click('test appointment one', '.month-container');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    I.click('test appointment two', '.month-container');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    // create in Day view
    I.clickToolbar('View');
    I.click('Day');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see('New calendar', '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');
    I.click('~Start time');
    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // create second appointment in different calendar
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('5:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Day view
    I.clickToolbar('View');
    I.click('Day');
    I.waitForText('test appointment one', 5, '.weekview-container');
    I.waitForText('test appointment two', 5, '.weekview-container');

    I.see('test appointment one', '.weekview-container.day .appointment .title');
    I.see('test appointment two', '.weekview-container.day .appointment .title');
    I.seeNumberOfElements('.weekview-container.day .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.seeNumberOfElements('.weekview-container.day .appointment .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment one', '.weekview-container.day .appointment .title');
    I.seeNumberOfElements('.weekview-container.day .appointment .title', 2);

    // remove
    I.click('test appointment one', '.weekview-container.day .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    I.click('test appointment two', '.weekview-container.day .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-sidepopup');

    I.logout();

});
