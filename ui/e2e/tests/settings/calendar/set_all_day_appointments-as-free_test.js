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

Scenario('[C7866] Set all-day appointments to be marked as free @shaky', async function (I) {

    const freeappointmentsubject = 'Free Appt',
        reservedappointmentsubject = 'Reserved Appt',
        location = 'Dortmund',
        description = 'Set all-day appointments to be marked as free';

    await I.haveSetting('io.ox/calendar//markFulltimeAppointmentsAsFree', false);
    I.login(['app=io.ox/calendar&perspective=week:week']);

    // Make sure setting is set correctly
    I.click('~Settings', '#io-ox-settings-topbar-icon');

    I.waitForVisible('.settings-container');
    I.click({ css: '[data-id="virtual/settings/io.ox/calendar"]' });
    I.waitForElement('.alarms-link-view .btn-link');
    I.dontSeeCheckboxIsChecked('Mark all day appointments as free');

    // Create all day appointment and dont mark as free
    I.openApp('Calendar');
    I.clickToolbar('New appointment');
    I.waitForText('Subject');
    I.fillField('summary', reservedappointmentsubject);
    I.fillField('location', location);
    I.click('All day', '.io-ox-calendar-edit-window');
    I.fillField('description', description);
    I.dontSeeCheckboxIsChecked('transp');
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForElement('.appointment.reserved');

    // Change setting
    I.click('~Settings', '#io-ox-settings-topbar-icon');
    I.waitForVisible('.io-ox-calendar-settings');
    I.waitForElement('.alarms-link-view .btn-link');
    I.click('Mark all day appointments as free', '.io-ox-calendar-settings');

    // Create new all day appointment and see if it is marked as free
    I.openApp('Calendar');
    I.waitForVisible('.weekview-toolbar');
    // Have to click on today button for setting to work
    I.click('button.weekday.today', '.weekview-toolbar');
    I.waitForText('Subject');
    I.fillField('summary', freeappointmentsubject);
    I.fillField('location', location);
    I.fillField('description', description);
    I.seeCheckboxIsChecked('allDay');
    I.seeCheckboxIsChecked('transp');
    I.click('Create');
    I.waitForElement('div.appointment.free');
});
