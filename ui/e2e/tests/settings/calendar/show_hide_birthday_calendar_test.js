/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />
Feature('Settings > Calendar');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C248441] Configure to show/hide birthday calendar', async function (I) {
    I.login();
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings');

    ///////Check whether birthday calendar is shown on Calendar App
    I.click({ css: '[data-id="virtual/settings/io.ox/calendar"]' });
    I.waitForElement('[name="birthday"]');
    I.waitForText('Show birthday calendar');
    I.selectFolder('Birthdays');

    ///////Check whether birthday calendar is not shown on Calendar App
    I.openApp('Calendar');
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings');
    I.click('Show birthday calendar');
    I.openApp('Calendar');
    I.waitForText('My calendars');
    I.dontSee('Birthdays');
});
