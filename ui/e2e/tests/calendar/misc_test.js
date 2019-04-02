/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */


/// <reference path="../../steps.d.ts" />

const moment = require('moment');
const expect = require('chai').expect;

Feature('Calendar > Misc');

Before(async (users) => {
    await users.create();
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C274425] Month label in Calendar week view', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//viewView', 'week:week');
    I.login('app=io.ox/calendar', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');
    await I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2019-05-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('April - May 2019 CW 18');
    await I.executeScript('ox.ui.apps.get("io.ox/calendar").setDate(new moment("2020-01-01"))');
    expect(await I.grabTextFrom('.weekview-container .header .info')).to.equal('December 2019 - January 2020 CW 1');
    I.logout();
});