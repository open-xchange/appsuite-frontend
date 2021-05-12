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

Feature('Calendar');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Change working time and check in weekview', async function ({ I, calendar, settings }) {

    I.login('app=io.ox/calendar&perspective=week:workweek');
    calendar.waitForApp();

    I.say('Check inital working time');
    I.see('7 AM', '.week-container-label .working-time-border:not(.in) .number');
    I.see('5 PM', '.week-container-label .working-time-border.in .number');

    I.say('Swich to settings');
    I.click('~Settings', '#io-ox-topbar-settings-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings', '#topbar-settings-dropdown');
    settings.waitForApp();
    I.waitForText('Calendar', 10, '.io-ox-settings-window .leftside .tree-container');

    settings.select('Calendar');
    I.waitForText('Start of working time', 5);
    I.say('Change working time');
    I.selectOption('Start of working time', '6:00 AM');
    I.selectOption('End of working time', '6:00 PM');

    // switch to calendar
    I.openApp('Calendar');
    calendar.waitForApp();

    I.say('Check new working time');
    I.see('5 AM', '.week-container-label .working-time-border:not(.in) .number');
    I.see('5 PM', '.week-container-label .working-time-border.in .number');
});
