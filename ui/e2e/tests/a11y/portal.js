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

Scenario('Portal - View with empty standard tiles', async ({ I, portal }) => {
    await I.haveSetting({ 'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false } });
    I.login('app=io.ox/portal');
    portal.waitForApp();
    I.waitForText('Inbox');
    I.waitForText('Appointments');
    I.waitForText('My tasks');
    I.waitForText('Birthdays');
    I.waitForText('My latest files');
    I.waitForNetworkTraffic();

    expect(await I.grabAxeReport()).to.be.accessible;
});
