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


Scenario('[C7867] Set new default reminder', async function (I) {
    const alaramNotification = 'Notification';
    const alaramTime = '45 minutes';
    const alaramRelated = 'before start';
    I.login();

    // Default reminder
    I.click('~Settings', '#io-ox-settings-topbar-icon');
    I.waitForVisible('.folder li[data-id="virtual/settings/io.ox/calendar"]');
    // I.waitForVisible('.tree-container > li[data-id="virtual/settings/io.ox/calendar"]');
    I.click({ css: '[data-id="virtual/settings/io.ox/calendar"]' });
    I.waitForElement('.alarms-link-view .btn-link');

    //I.click('.alarms-link-view .btn-link');
    I.click(
        locate('.form-group')
            .withChild(locate('label').withText('Default reminder'))
        .find('button')
    );
    I.waitForText('Edit reminders');
    I.click('Add reminder', '.modal-dialog');
    I.selectOption('.alarm-action', alaramNotification);
    I.selectOption('.alarm-time', alaramTime);
    I.selectOption('.alarm-related', alaramRelated);
    I.click({ css: '[data-action="apply"]' });
    I.openApp('Calendar');

    // Check whether Notify 45 minutes before start is shown on appoitment creation window
    I.clickToolbar('New appointment');
    I.waitForText('Subject');
    I.see('Notify 45 minutes before start.');
});

