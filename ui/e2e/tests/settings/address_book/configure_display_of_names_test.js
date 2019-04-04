/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Benedikt Kröning <benedikt.kroening@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings Address Book');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7862] Configure display name representation', async (I) => {
    const folder = await I.grabDefaultFolder('contacts');
    await I.haveContact({ folder_id: folder, first_name: 'Foo', last_name: 'Bar' });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/contacts']);
    I.waitForVisible({ css: 'div[data-point="io.ox/contacts/settings/detail/view"]' });

    // go into settings and change display style of contacts
    I.waitForText('Address Book', 10, 'div[data-point="io.ox/contacts/settings/detail/view"]');
    I.waitForText('Display of names');
    I.click('First name Last name');

    // Verify the displayed style
    I.openApp('Address Book');
    I.waitForVisible('[data-app-name="io.ox/contacts"]');
    I.selectFolder('Contacts');

    I.waitForElement('.contact-grid-container');
    I.waitForText('Foo Bar');
    I.click('Foo Bar', '.fullname');

    // Go back to settings and switch to other display style
    I.click('#io-ox-topbar-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings');

    // Select address book settings
    I.waitForText('Address Book', 5, '.folder-node');
    I.selectFolder('Address Book');
    I.waitForText('Address Book', 5, '[data-app-name="io.ox/settings"]');

    I.waitForText('Display of names');
    I.click('Last name, First name');

    // Go back to contacts app and verify it
    I.openApp('Address Book');
    I.waitForVisible('[data-app-name="io.ox/contacts"]');
    I.selectFolder('Contacts');
    I.waitForElement('.contact-grid-container');
    I.waitForText('Bar, Foo');
    I.click('Bar, Foo', '.fullname');

    I.logout();
});
