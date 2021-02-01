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


Scenario('[C7869] Set new start and end of working time', async function ({ I }) {
    const workingStartTime = '7:00 AM';
    const workingEndTime = '9:00 AM';

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/calendar']);
    I.waitForText('Start of working time');
    I.selectOption('#settings-startTime', workingStartTime);
    I.selectOption('#settings-endTime', workingEndTime);
    I.openApp('Calendar');
    I.waitForVisible('.working-time-border');

    // Check to see number of working hours
    I.see('7 AM', '.time.in');
    I.see('8 AM', '.time.in');
    I.seeNumberOfElements('.time.in', 2);
});
