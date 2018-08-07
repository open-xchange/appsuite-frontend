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

const expect = require('chai').expect;

Feature('Calendar: Create appointment');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointments in multiple calendars', function (I, users) {
    let [user] = users;

    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.clickToolbar('View');
    I.click('Workweek');

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
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name +'"] .color-label');

    // create in Workweek view
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see('Calendar:' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .header.container .header-right');

    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('4:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.see('test appointment one', '.week-view .appointment .title');

    I.seeNumberOfElements('.week-view .appointment .title', 1);

    // create second appointment in different calendar
    I.selectFolder('New calendar');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see('Calendar:New calendar', '.io-ox-calendar-edit-window .header.container .header-right');

    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('5:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.see('test appointment one', '.week-view .appointment .title');
    I.see('test appointment two', '.week-view .appointment .title');
    I.seeNumberOfElements('.week-view .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.dontSee('test appointment two', '.week-view .appointment .title');
    I.seeNumberOfElements('.week-view .appointment .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment two', '.week-view .appointment .title');
    I.seeNumberOfElements('.week-view .appointment .title', 2);

    // remove appointments
    I.click('//div[@class="title" and text()="test appointment one"]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.click('//div[@class="title" and text()="test appointment two"]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    // create in Week view
    I.selectFolder('New calendar');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('View');
    I.click('Week');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see('Calendar:New calendar', '.io-ox-calendar-edit-window .header.container .header-right');
    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('4:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // create second appointment in different calendar
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name +'"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see('Calendar:' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .header.container .header-right');

    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('5:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Week view
    I.clickToolbar('View');
    I.click('Week');

    I.see('test appointment one', '.weekview .appointment .title');
    I.see('test appointment two', '.weekview .appointment .title');
    I.seeNumberOfElements('.weekview .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.dontSee('test appointment one', '.week-view .appointment .title');
    I.seeNumberOfElements('.weekview .appointment .appointment-content .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment one', '.week-view .appointment .title');
    I.seeNumberOfElements('.weekview .appointment .appointment-content .title', 2);

    // remove
    I.click('(//div[@class="title" and text()="test appointment one"])[2]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.click('(//div[@class="title" and text()="test appointment two"])[2]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    // create in Month view
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name +'"] .color-label');
    I.clickToolbar('View');
    I.click('Month');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see('Calendar:' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .header.container .header-right');
    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('4:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    // create second appointment in different calendar
    I.selectFolder('New calendar');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see('Calendar:New calendar', '.io-ox-calendar-edit-window .header.container .header-right');

    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('5:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Month view
    I.clickToolbar('View');
    I.click('Month');
    I.see('test appointment one', '.month-container .appointment .title');
    I.see('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.dontSee('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .appointment-content .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .appointment-content .title', 2);

    // remove
    I.click('//span[@class="title" and text()="test appointment one"]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.click('//span[@class="title" and text()="test appointment two"]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    // create in Day view
    I.clickToolbar('View');
    I.click('Day');
    I.waitForElement('li.selected[aria-label="New calendar"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see('Calendar:New calendar', '.io-ox-calendar-edit-window .header.container .header-right');
    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('4:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // create second appointment in different calendar
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name +'"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see('Calendar:' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .header.container .header-right');

    I.click('.io-ox-calendar-edit-window .time-field');
    I.click('5:00 PM', '.io-ox-calendar-edit-window .calendaredit');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Day view
    I.clickToolbar('View');
    I.click('Day');

    I.see('test appointment one', '.dayview .appointment .title');
    I.see('test appointment two', '.dayview .appointment .title');
    I.seeNumberOfElements('.dayview .appointment .title', 2);

    // switch off New calendar
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.dontSee('test appointment one', '.dayview .appointment .title');
    I.seeNumberOfElements('.dayview .appointment .title', 1);

    // switch on again
    I.click('[aria-label="New calendar"] .color-label', '.window-sidepanel');
    I.see('test appointment one', '.dayview .appointment .title');
    I.seeNumberOfElements('.dayview .appointment .title', 2);

    // remove
    I.click('(//div[@class="title" and text()="test appointment one"])[3]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.click('(//div[@class="title" and text()="test appointment two"])[3]');
    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('.io-ox-sidepopup [data-action="delete"]');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.logout();

});
