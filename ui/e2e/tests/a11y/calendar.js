/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');
const moment = require('moment');

const options = {
    rules: {
        'scrollable-region-focusable': { enabled: false }, // [MODERATE] Ensure that scrollable region has keyboard access
        'aria-required-children': { enabled: false } //  [CRITICAL] Certain ARIA roles must contain particular children
    }
};

async function openPerspective(I, perspective) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });

    I.login(['app=io.ox/calendar', 'perspective=' + perspective]);
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);
}

Scenario('Calendar - Day view w/o appointments', async (I) => {
    await openPerspective(I, 'week:day');
    I.waitForVisible('.current-time-indicator');

    expect(await I.grabAxeReport(undefined, options)).to.be.accessible;
});

Scenario('Calendar - Workweek view w/o appointments', async (I) => {
    await openPerspective(I, 'week:workweek');
    I.waitForVisible('.week-container-label');

    expect(await I.grabAxeReport(undefined, options)).to.be.accessible;
});

Scenario('Calendar - Week view w/o appointments', async (I) => {
    await openPerspective(I, 'week:week');
    I.waitForVisible('.week-container-label');

    expect(await I.grabAxeReport(undefined, options)).to.be.accessible;
});

Scenario('Calendar - Month view w/o appointments', async function (I) {
    await openPerspective(I, 'month');
    I.waitForVisible('.month-container');

    expect(await I.grabAxeReport(undefined, options)).to.be.accessible;
});

Scenario('Calendar - Year', async (I) => {
    await openPerspective(I, 'year');
    I.waitForVisible('.year-view-container');

    // The excluded td.out are a visual representation of the days of the previous month
    // that are aria-hidden and role="presentation", this is a false positive.
    // This should be checked, with future axe-core updates.
    expect(await I.grabAxeReport({ exclude: [['td.out']] }, options)).to.be.accessible;
});

Scenario('Calendar - List view w/o appointments', async (I) => {
    await openPerspective(I, 'list');
    I.waitForVisible('.io-ox-center.multi-selection-message');

    expect(await I.grabAxeReport(undefined, options)).to.be.accessible;
});

Scenario('Calendar - Month view with appointment clicked', async (I, calendar) => {
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';

    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'test invite accept/decline/accept tentative',
        startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) }
    });

    I.login('app=io.ox/calendar&perspective=month');
    calendar.waitForApp();
    I.waitForVisible('.appointment');
    I.click('.appointment');

    expect(await I.grabAxeReport()).to.be.accessible;
});
