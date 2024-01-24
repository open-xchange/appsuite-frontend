/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C276001] Change Quicklaunch limit', async ({ I }) =>{
    await I.haveSetting('io.ox/core//apps/quickLaunchCount', 5);
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    I.waitForVisible({ css: 'div[data-point="io.ox/core/settings/detail/view"]' });

    I.click('Configure quick launchers ...');

    I.selectOption('Position 1', 'Mail');
    I.selectOption('Position 2', 'Calendar');
    I.selectOption('Position 3', 'Address Book');
    I.selectOption('Position 4', 'Drive');
    I.selectOption('Position 5', 'Portal');

    I.click('Save changes');

    I.click('#io-ox-refresh-icon');

    await within('#io-ox-quicklaunch', async () => {
        I.seeElement('[data-app-name="io.ox/mail"]');
        I.seeElement('[data-app-name="io.ox/calendar"]');
        I.seeElement('[data-app-name="io.ox/contacts"]');
        I.seeElement('[data-app-name="io.ox/files"]');
        I.seeElement('[data-app-name="io.ox/portal"]');
    });
});

Scenario('[C256960] Configure quick launch icons', async ({ I }) =>{
    await Promise.all([
        I.haveSetting('io.ox/core//logoAction', 'https://www.open-xchange.com/'),
        I.haveSetting('io.ox/core//apps/quickLaunchCount', 5),
        I.haveSetting('io.ox/core//apps/quickLaunch', 'io.ox/calendar/main,io.ox/mail/main,io.ox/files/main')
    ]);
    I.login();
    // Check Quicklaunchers
    await within('#io-ox-quicklaunch', async () => {
        I.waitForElement('~Mail');
        I.waitForElement('~Calendar');
        I.waitForElement('~Drive');
    });
    // Check Logo Action
    I.click('#io-ox-top-logo');
    I.wait(5);
    I.switchToNextTab();
    I.seeCurrentUrlEquals('https://www.open-xchange.com/');
});

Scenario('[C256960] Logo Action points to autostart app', async ({ I, calendar, mail }) =>{
    await Promise.all([
        I.haveSetting('io.ox/core//logoAction', 'autoStart') // AutoStart defaults to mail app
    ]);
    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    // Check Logo Action
    I.click('#io-ox-top-logo'); // This should take us to the mail app
    mail.waitForApp();
});
