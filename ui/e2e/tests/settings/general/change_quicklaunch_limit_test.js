/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C276001] Change Quicklaunch limit', async (I) =>{
    await I.haveSetting('io.ox/core//apps/quickLaunchCount', 5);
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    I.waitForVisible({ css: 'div[data-point="io.ox/core/settings/detail/view"]' });
  
    I.selectOption('Quick launch 1', 'Mail');
    I.selectOption('Quick launch 2', 'Calendar');
    I.selectOption('Quick launch 3', 'Address Book');
    I.selectOption('Quick launch 4', 'Drive');
    I.selectOption('Quick launch 5', 'Portal');

    I.click('#io-ox-refresh-icon');

    await within('#io-ox-quicklaunch', async () => {
        I.seeElement('[data-app-name="io.ox/mail"]');
        I.seeElement('[data-app-name="io.ox/calendar"]');
        I.seeElement('[data-app-name="io.ox/contacts"]');
        I.seeElement('[data-app-name="io.ox/files"]');
        I.seeElement('[data-app-name="io.ox/portal"]');
    });
});
