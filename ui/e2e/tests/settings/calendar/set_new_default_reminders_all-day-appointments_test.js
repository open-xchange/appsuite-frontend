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

Scenario('[C244799] Set new default reminder for all-day appointments', async function ({ I }) {
    const alaramNotification = 'Notification';
    const alaramTime = '1 day';
    const alaramRelated = 'before start';
    I.login();

    // Default reminder
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/calendar' });
    I.waitForElement('.alarms-link-view .btn-link');
    I.click(
        locate('.form-group')
            .withChild(locate('label').withText('Default reminder for all-day appointments'))
        .find('button')
    );

    I.waitForText('Edit reminders');
    I.click('Add reminder');
    I.selectOption('.alarm-action', alaramNotification);
    I.selectOption('.alarm-time', alaramTime);
    I.selectOption('.alarm-related', alaramRelated);
    I.click({ css: '[data-action="apply"]' });

    // verify reminder is set as a notification to 1 day before start by default.
    I.openApp('Calendar');
    I.clickToolbar('New appointment');
    I.waitForText('Subject', 30, '.io-ox-calendar-edit');
    I.fillField('summary', 'subject');
    I.fillField('location', 'Dortmund');
    I.checkOption('All day');
    I.fillField('description', 'description');
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit');

    I.waitForText('subject', '.appointment-content');
    I.click('subject', '.appointment-content');

    I.waitForVisible(locate('li > a').withText('Edit').inside('.io-ox-sidepopup'));
    I.click('Edit');
    I.waitForElement('.io-ox-calendar-edit');
    I.waitForText('Notify 1 day before start.');
});
