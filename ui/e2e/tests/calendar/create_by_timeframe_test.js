/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../steps.d.ts" />

const moment = require('moment');
const expect = require('chai').expect;

Feature('Calendar > Create');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7433] Create appointment by marking some timeframe', async ({ I, calendar }) => {
    const apnt_subject = 'C7433-' + Math.random().toString(36).substring(7);
    const apnt_location = 'C7433-' + Math.random().toString(36).substring(7);

    I.login('app=io.ox/calendar&perspective="week:day"');
    calendar.waitForApp();

    I.clickToolbar('Today');

    // Create appointment from 01:00am to 03:00am today
    await within('.appointment-container', async () => {
        I.scrollTo('//div[contains(@class, "timeslot")][3]');
        // each timeslot element represents 30 minute blocks
        // The first slot will be from 00:00am to 00:30am...
        // The third slot will be 01:00am to 01:30am (add 3 slots)
        // The sixth slot will be from 02:30am to 03:00am
        // Drag from 01:00(3) down to 03:00(6)
        I.dragAndDrop({ xpath: '//div[contains(@class, "timeslot")][3]' }, { xpath: '//div[contains(@class, "timeslot")][6]' });
    });
    I.waitForVisible('.floating-window');
    I.waitForText('Create appointment');
    I.fillField('summary', apnt_subject);
    I.fillField('location', apnt_location);
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    // open overlay
    I.click(apnt_subject, '.appointment');
    I.waitForVisible('.io-ox-sidepopup .date');
    await within('.io-ox-sidepopup', async () => {
        I.see(apnt_subject);
        I.see(apnt_location);
        // check time / date - should be 1am to 3am, 2hrs
        const apnt_date = await I.grabTextFrom('.date'); // expected: moment().format(L)
        const apnt_time = await I.grabTextFrom('.time'); // expected: 01:00 - 03:00 AM
        expect(apnt_date).to.contain(moment().format('l'));
        expect(apnt_time).to.contain('1:00 – 3:00 AM');
    });
});
