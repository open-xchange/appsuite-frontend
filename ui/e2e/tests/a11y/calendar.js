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
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login(['app=io.ox/calendar', 'perspective=' + perspective]);
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);
}

Scenario('Calendar - Day view w/o appointments', async function (I) {
    openPerspective(I, 'week:day');
    I.waitForVisible('.current-time-indicator');

    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});

Scenario('Calendar - Workweek view w/o appointments', async function (I) {
    openPerspective(I, 'week:workweek');
    I.waitForVisible('.week-container-label');

    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});

Scenario('Calendar - Week view w/o appointments', async function (I) {
    openPerspective(I, 'week:week');
    I.waitForVisible('.week-container-label');

    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});

Scenario('Calendar - Month view w/o appointments', async function (I) {
    openPerspective(I, 'month');
    I.waitForVisible('.month-container');

    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});

Scenario.skip('Calendar - Year', async function (I) {
    openPerspective(I, 'year');
    I.waitForVisible('.year-view-container');

    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});

Scenario('Calendar - List view w/o appointments', async function (I) {
    openPerspective(I, 'list');
    I.waitForVisible('.io-ox-center.multi-selection-message');

    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});
