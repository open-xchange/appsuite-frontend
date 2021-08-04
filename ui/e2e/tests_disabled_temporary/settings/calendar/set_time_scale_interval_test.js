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

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Calendar');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7864] Set time scale interval', async ({ I, calendar }) => {
    function checkAppointment(start, end) {
        I.waitForVisible(calendar.locators.edit);
        I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
        I.seeInField(calendar.locators.starttime, start);
        I.seeInField(calendar.locators.endtime, end);
        I.click('Discard');
        I.waitForDetached(calendar.locators.edit);
    }
    // use native scrollIntoView function, as it is more reliable
    function scrollToTimeslot(number) {
        document.querySelector(`.page.current .timeslot:nth-child(${number})`).scrollIntoView();
        return true;
    }

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/calendar');
    I.waitForVisible('#settings-interval');
    I.selectOption('interval', '5 minutes');
    I.waitForNetworkTraffic();

    I.openApp('Calendar', { perspective: 'week:day' });
    calendar.waitForApp();

    await within('.page.current .appointment-container', () => {
        I.waitForFunction(scrollToTimeslot, ['144']);
        I.waitForVisible('.timeslot:nth-child(147)');
        I.wait(0.2);
        I.dragAndDrop('.timeslot:nth-child(145)', '.timeslot:nth-child(147)');
    });

    checkAppointment('12:00', '12:15');

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
    I.waitForVisible('#settings-interval');
    I.selectOption('interval', '60 minutes');
    I.waitForNetworkTraffic();

    I.openApp('Calendar', { perspective: 'week:day' });
    calendar.waitForApp();

    await within('.page.current .appointment-container', () => {
        I.waitForFunction(scrollToTimeslot, ['12']);
        I.waitForVisible('.timeslot:nth-child(15)');
        I.wait(0.2);
        I.dragAndDrop('.timeslot:nth-child(13)', '.timeslot:nth-child(15)');
    });

    checkAppointment('12:00', '3:00');

});
