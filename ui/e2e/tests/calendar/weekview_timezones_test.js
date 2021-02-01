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

Feature('Calendar > Create');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Create appointment and switch timezones', async function ({ I, dialogs }) {

    await I.haveSetting('io.ox/core//timezone', 'Europe/Berlin');
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().tz('Europe/Berlin').startOf('week').add(1, 'day').add('16', 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    await I.haveAppointment({
        folder: folder,
        summary: 'test timezones',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: moment(time).add(1, 'hour').format(format), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    // check in view
    I.waitForVisible('.workweek .title');
    I.seeNumberOfElements({ xpath: '//div[contains(concat(" ", @class, " "), "workweek")]//div[@class="title" and text()="test timezones"]' }, 1);

    // switch to settings
    I.click('~Settings', '#io-ox-settings-topbar-icon');

    I.waitForVisible('.io-ox-settings-window .leftside [title="Calendar"]');

    I.click('~Calendar', '.leftside');
    I.waitForVisible('.io-ox-settings-window .leftside [title="Favorite timezones"]');
    I.click('~Favorite timezones', '.leftside');

    I.waitForText('Add timezone', 5);
    I.click('Add timezone');

    dialogs.waitForVisible();
    I.waitForText('Time zone', 5, dialogs.locators.body);
    I.selectOption('Time zone', '(+09:00) JST Tokyo');
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');

    I.waitForText('Asia/Tokyo', 5, '.rightside li');

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
    I.see(moment(time).hour(7).tz('Asia/Tokyo').format('h A'), '.week-container-label.secondary-timezone .working-time-border:not(.in) .number');

    I.click('test timezones', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.floating-window-content [data-attribute="startDate"] .timezone');
    I.click('.floating-window-content [data-attribute="startDate"] .timezone');

    dialogs.waitForVisible();
    I.waitForText('Start date timezone', 5, dialogs.locators.body);
    I.selectOption('Start date timezone', '(+09:00) JST Tokyo');
    I.selectOption('End date timezone', '(+09:00) JST Tokyo');
    dialogs.clickButton('Change');
    I.waitForDetached('.modal-dialog');

    I.waitForText('Europe/Berlin: ');
    I.waitForText('Mon, ' + time.format('l'));
    I.waitForText('4:00 – 5:00 PM');

    I.click('Discard', '.floating-window-content');
    dialogs.waitForVisible();
    dialogs.clickButton('Discard changes');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.floating-window-content');

    I.waitForVisible('.io-ox-sidepopup [data-action="close"]');
    I.click('.io-ox-sidepopup [data-action="close"]');
    I.waitForDetached('.io-ox-sidepopup');

    // switch to settings
    I.click('~Settings', '#io-ox-settings-topbar-icon');

    I.waitForVisible('.io-ox-settings-window');

    I.click('~Calendar', '.leftside');
    I.click('~Favorite timezones', '.leftside');
    I.waitForText('Asia/Tokyo', '.rightside li');

    // remove extra timezone
    I.click('.rightside li a[data-action="delete"]');
    I.dontSee('Asia/Tokyo', '.rightside ul');

    // inspect in calendar app
    I.openApp('Calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.seeNumberOfElements('.workweek .week-container-label', 1);
    I.dontSee('JST', '.workweek');
    I.see('7 AM', '.week-container-label:not(.secondary-timezone) .working-time-border .number');

    // switch to settings
    I.click('~Settings', '#io-ox-settings-topbar-icon');

    I.waitForVisible('.io-ox-settings-window');

    I.click({ css: '.io-ox-settings-window .leftside [title="Calendar"]' });

    I.waitForText('Workweek view', 5, '.rightside');
    I.selectOption('Week start', 'Tuesday');
    I.selectOption('Workweek length', '3 days');

    // switch to calendar
    I.openApp('Calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.seeNumberOfElements('.workweek .weekday', 3);
});
