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
