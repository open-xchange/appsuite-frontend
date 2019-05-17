/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <chrsitoph.kopp@open-xchange.com>
 */

Feature('Calendar');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Change working time and check in weekview', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder('Calendar');
    I.clickToolbar('View');
    I.click('Workweek');

    I.see('7 AM', '.week-container-label .working-time-border:not(.in) .number');
    I.see('5 PM', '.week-container-label .working-time-border.in .number');

    // switch to settings
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings', '#topbar-settings-dropdown');

    I.waitForVisible('.io-ox-settings-window .leftside [title="Calendar"]');
    I.click('~Calendar', '.leftside');
    I.waitForText('Start of working time', 5);

    I.selectOption('Start of working time', '6:00 AM');
    I.selectOption('End of working time', '6:00 PM');

    // switch to calendar
    I.openApp('Calendar');
    I.wait(1);

    I.see('5 AM', '.week-container-label .working-time-border:not(.in) .number');
    I.see('5 PM', '.week-container-label .working-time-border.in .number');
});
