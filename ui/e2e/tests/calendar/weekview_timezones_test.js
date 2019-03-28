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

const moment = require('moment-timezone');

Feature('Calendar: Switch timezones').tag('3');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointment and switch timezones', async function (I) {

    await I.haveSetting('io.ox/core//timezone', 'Europe/Berlin');

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    // create in Workweek view
    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('Workweek');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test timezones');
    I.fillField('Location', 'invite location');

    const nextMonday = moment().tz('Europe/Berlin').startOf('week').add('8', 'day');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(nextMonday.format('l'));
    I.pressKey('Enter');

    I.click('~Start time');

    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in view
    I.waitForVisible('.workweek .title');
    I.seeNumberOfElements('//div[contains(concat(" ", @class, " "), "workweek")]//div[@class="title" and text()="test timezones"]', 1);

    // switch to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings', '#topbar-settings-dropdown');

    I.waitForVisible('.io-ox-settings-window .leftside [title="Calendar"]');

    I.click('~Calendar', '.leftside');
    I.waitForVisible('.io-ox-settings-window .leftside [title="Favorite timezones"]');
    I.click('~Favorite timezones', '.leftside');

    I.waitForText('Add timezone', 5);
    I.click('Add timezone');

    I.waitForVisible('.modal-dialog');
    I.selectOption('Time zone', '+09:00 JST Asia/Tokyo');
    I.click('Add', '.modal-dialog');
    I.waitForDetached('.modal-dialog');

    I.waitForText('Asia/Tokyo', '.rightside li');

    // switch to calendar
    I.openApp('Calendar');

    I.waitForVisible('.workweek .time-label-bar', 5);
    I.wait(1);
    I.click('.workweek .time-label-bar');
    I.waitForVisible('.timezone-label-dropdown [data-name="Asia/Tokyo"]');
    I.click('.timezone-label-dropdown [data-name="Asia/Tokyo"]');
    I.pressKey('Escape');
    I.waitForVisible('.workweek .timezone');
    I.seeNumberOfElements('.workweek .week-container-label', 2);
    I.see('JST', '.workweek .timezone');
    I.see('7 AM', '.week-container-label:not(.secondary-timezone) .working-time-border:not(.in) .number');
    I.see(moment(nextMonday).hour(7).tz('Asia/Tokyo').format('h A'), '.week-container-label.secondary-timezone .working-time-border:not(.in) .number');

    I.click('test timezones', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.floating-window-content [data-attribute="startDate"] .timezone');
    I.click('.floating-window-content [data-attribute="startDate"] .timezone');
    I.waitForVisible('.modal-dialog [name="startTimezone"]');
    I.selectOption('Start date timezone', '+09:00 JST Asia/Tokyo');
    I.selectOption('End date timezone', '+09:00 JST Asia/Tokyo');
    I.click('Change');
    I.waitForDetached('.modal-dialog');

    I.waitForText('Europe/Berlin: ');
    I.waitForText('Mon, ' + nextMonday.format('l'));
    I.waitForText('4:00 – 5:00 PM');

    I.click('Discard', '.floating-window-content');
    I.waitForVisible('.modal-dialog');
    I.click('Discard changes', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.floating-window-content');

    I.waitForVisible('.io-ox-sidepopup [data-action="close"]');
    I.click('.io-ox-sidepopup [data-action="close"]');
    I.waitForDetached('.io-ox-sidepopup');

    // switch to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings', '#topbar-settings-dropdown');

    I.waitForVisible('.io-ox-settings-window');

    I.click('~Calendar', '.leftside');
    I.click('~Favorite timezones', '.leftside');
    I.waitForText('Asia/Tokyo', '.rightside li');

    // remove extra timezone
    I.click('.rightside li a[data-action="delete"]');
    I.dontSee('Asia/Tokyo', '.rightside ul');

    // inspect in calendar app
    I.openApp('Calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.seeNumberOfElements('.workweek .week-container-label', 1);
    I.dontSee('JST', '.workweek');
    I.see('7 AM', '.week-container-label:not(.secondary-timezone) .working-time-border .number');

    // switch to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings', '#topbar-settings-dropdown');

    I.waitForVisible('.io-ox-settings-window');

    I.click({ css: '.io-ox-settings-window .leftside [title="Calendar"]' });

    I.waitForText('Workweek view', 5, '.rightside');
    I.selectOption('Week start', 'Tuesday');
    I.selectOption('Workweek length', '3 days');

    // switch to calendar
    I.openApp('Calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.seeNumberOfElements('//div[contains(concat(" ", @class, " "), "workweek")]//button[@class="weekday"]', 3);
    I.wait(1);

    I.logout();

});
