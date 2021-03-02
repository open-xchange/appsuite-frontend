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

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});


Scenario('[C7867] Set new default reminder', async function ({ I, calendar, dialogs }) {
    const alaramNotification = 'Notification';
    const alaramTime = '45 minutes';
    const alaramRelated = 'before start';
    I.login();

    // Default reminder
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
    I.waitForElement('.alarms-link-view .btn-link');

    //I.click('.alarms-link-view .btn-link');
    I.click(
        locate('.form-group')
            .withChild(locate('label').withText('Default reminder'))
        .find('button')
    );

    dialogs.waitForVisible();
    I.waitForText('Edit reminders', dialogs.locators.header);
    I.click('Add reminder', dialogs.locators.body);
    I.selectOption('.alarm-action', alaramNotification);
    I.selectOption('.alarm-time', alaramTime);
    I.selectOption('.alarm-related', alaramRelated);
    dialogs.clickButton('Apply');
    I.openApp('Calendar');
    calendar.waitForApp();

    // Check whether Notify 45 minutes before start is shown on appoitment creation window
    calendar.newAppointment();
    I.see('Notify 45 minutes before start.');
});

