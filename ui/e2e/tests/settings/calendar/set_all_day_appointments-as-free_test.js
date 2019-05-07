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

Scenario('[C7866] Set all-day appointments to be marked as free', async function (I) {

    const freeappointmentsubject = 'Automation of all-day appointments to be marked as free ';
    const reservedappointmentsubject = 'Automation of all-day appointments to be marked as reserved';
    const location = 'Dortmund';
    const description = 'Set all-day appointments to be marked as free';
    I.login();

    /////////Default reminder
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings');
    I.click({ css: '[data-id="virtual/settings/io.ox/calendar"]' });
    I.waitForElement('.alarms-link-view .btn-link');
    I.click('Mark all day appointments as free');

    /////// Verify that appointments "Shown as" is set to Free.
    I.openApp('Calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('summary', freeappointmentsubject);
    I.fillField('location', location);
    I.click('All day');
    I.fillField('description', description);
    I.click('Create');
    I.waitForText('Automation of', '.appointment-content');
    //I.waitForElement('.inline-toolbar-container');
    I.doubleClick('.weekday.today');
    I.waitForText('Participants can make changes');
    I.seeCheckboxIsChecked('transp');

    ////// Verify that appointments are "shown as" reserved
    I.click('Discard');
    I.click('#io-ox-topbar-dropdown-icon');
    I.click('Settings');
    I.click(locate('.folder-label').withText('Calendar'));
    I.click('Mark all day appointments as free');
    I.openApp('Calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('summary', reservedappointmentsubject);
    I.fillField('location', location);
    I.click('All day');
    I.fillField('description', description);
    I.click('Create');
    I.waitForText('Conflicts detected');
    I.click('Ignore conflicts');
    I.waitForDetached('.io-ox-sidepopup');
    I.doubleClick('.weekday.today');
    I.waitForText('Participants can make changes');
    I.dontSeeCheckboxIsChecked('transp');

});
