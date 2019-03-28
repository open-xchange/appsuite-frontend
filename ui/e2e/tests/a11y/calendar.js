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

function openPerspective(I, perspective) {
    I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });

    I.login(['app=io.ox/calendar', 'perspective=' + perspective]);
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);
}

Scenario('Calendar - Day view w/o appointments', async (I) => {
    openPerspective(I, 'week:day');
    I.waitForVisible('.current-time-indicator');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Calendar - Workweek view w/o appointments', async (I) => {
    openPerspective(I, 'week:workweek');
    I.waitForVisible('.week-container-label');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Calendar - Week view w/o appointments', async (I) => {
    openPerspective(I, 'week:week');
    I.waitForVisible('.week-container-label');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Calendar - Month view w/o appointments', async function (I) {
    openPerspective(I, 'month');
    I.waitForVisible('.month-container');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Calendar - Year', async (I) => {
    openPerspective(I, 'year');
    I.waitForVisible('.year-view-container');

    // The excluded td.out are a visual representation of the days of the previous month
    // that are aria-hidden and role="presentation", this is a false positive.
    // This should be checked, with future axe-core updates.
    expect(await I.grabAxeReport({ exclude: [['td.out']] })).to.be.accessible;
});

Scenario('Calendar - List view w/o appointments', async (I) => {
    openPerspective(I, 'list');
    I.waitForVisible('.io-ox-center.multi-selection-message');

    expect(await I.grabAxeReport()).to.be.accessible;
});
