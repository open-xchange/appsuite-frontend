/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Benedikt Kroening <benedikt.kroening@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C274141] Customize default app, order and count for Quicklauncher @contentReview', async ({ I }) =>{

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    I.waitForVisible({ css: 'div[data-point="io.ox/core/settings/detail/view"]' });

    I.selectOption({ css: '[name=autoStart]' }, 'Portal');

    I.click('Configure quick launchers ...');

    I.selectOption('Position 1', 'None');
    I.selectOption('Position 2', 'None');
    I.selectOption('Position 3', 'None');

    I.click('Save changes');

    I.click('#io-ox-refresh-icon');

    I.click('Configure quick launchers ...');

    I.selectOption('Position 1', 'Calendar');
    I.selectOption('Position 2', 'Address Book');
    I.selectOption('Position 3', 'io.ox/mail/main');

    I.click('Save changes');

    I.click('#io-ox-refresh-icon');

    I.logout();
    I.login();

    // Check that the above settings are made
    I.waitForVisible({ css: '.io-ox-portal' });

    await within('#io-ox-quicklaunch', async () => {
        I.seeElement({ css: '[data-app-name="io.ox/calendar"]' });
        I.seeElement({ css: '[data-app-name="io.ox/contacts"]' });
        I.seeElement({ css: '[data-app-name="io.ox/mail"]' });
    });
});
