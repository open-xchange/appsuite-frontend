/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
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
