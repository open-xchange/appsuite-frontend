/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7758] Set timezone', async ({ I, users }) => {

    // create appointment
    // let's use a fixed date to avoid problems
    // with daylight saving time around the globe.
    // time is 14:00 CEST, so 12:00 UTC.
    await I.haveAppointment({
        folder: `cal://0/${await I.grabDefaultFolder('calendar')}`,
        summary: 'Timezone test',
        startDate: { value: '20190403T140000', tzid: 'Europe/Berlin' },
        endDate: { value: '20190403T150000', tzid: 'Europe/Berlin' },
        attendees: [{ entity: users[0].userdata.id }]
    });

    // check major timezones
    var timezones = {
        'Australia/Adelaide': '10:30 PM', // +10.5
        'Asia/Hong_Kong': '8:00 PM', // +8
        'America/New_York': '8:00 AM', // -4
        'America/Los_Angeles': '5:00 AM', // -7
        'Europe/Berlin': '2:00 PM'
    };

    for (var id in timezones) {
        I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
        I.waitForText('Time zone');
        I.selectOption('Time zone', id);
        I.waitForVisible('.io-ox-alert');
        I.logout();
        I.login(['app=io.ox/calendar&perspective=month']);
        I.waitForText('Scheduling');
        I.waitForText('Today');
        I.executeScript(function () {
            // go to 2019-04-06 (not 1) to ensure we land in April
            ox.ui.App.getCurrentApp().setDate(1554595200000);
        });
        I.waitForText('Timezone test');
        I.waitForText(timezones[id]);
        I.logout();
    }
});
