/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Benedikt Kröning <benedikt.kroening@open-xchange.com>
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
