/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ben Ehrengruber <ben.ehrengruber@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('Client Onboarding > Tours');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('Welcome Tour', (I) => {
    I.login('app=io.ox/mail');
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Getting started');
    I.click("Start tour");
    I.see("Navigation");
    I.seeElement(".hotspot");
    I.seeElement(".launcher-dropdown");
    I.click("Next");
    I.see("Personal settings");
    I.seeElement(".hotspot");
    I.seeElement("#topbar-settings-dropdown");
    I.click("Next");
    I.see("Settings");
    I.seeElement(".hotspot");
    I.click("Next");
    I.see("Help");
    I.seeElement(".hotspot");
    I.click("Finish");
    I.logout();
});