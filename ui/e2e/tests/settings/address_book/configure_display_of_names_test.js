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

Feature('Settings > Address Book');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7862] Configure display name representation', async ({ I, contacts }) => {
    const folder = await I.grabDefaultFolder('contacts'),
        firstName = 'Foo',
        lastName = 'Bar';

    await I.haveContact({ folder_id: folder, first_name: firstName, last_name: lastName });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/contacts']);
    I.waitForVisible('.io-ox-contacts-settings');

    // go into settings and change display style of contacts
    I.say('Setting: firstname lastname');
    I.waitForText('Address Book', 10, '.io-ox-contacts-settings');
    I.waitForText('Display of names', undefined, '.io-ox-contacts-settings');
    I.click('First name Last name', '.io-ox-contacts-settings');

    // Verify the displayed style
    I.openApp('Address Book');
    contacts.waitForApp();
    I.waitForElement('.contact-grid-container');
    const firstNameLocator = locate('.first_name').withText(firstName).inside('.contact-detail').as('first name node'),
        lastNameLocator = locate('.last_name').withText(lastName).inside('.contact-detail').as('last name node');
    I.wait(1); //wait for listeners to be attached
    I.click('.selectable.contact');
    I.waitForElement(firstNameLocator.before(lastNameLocator).as(`'${firstName} ${lastName}'`), 5, '.fullname');

    // Go back to settings and switch to other display style
    I.say('Setting: lastname, firstname');
    I.openApp('Settings', { folder: 'virtual/settings/io.ox/contacts' });
    I.waitForText('Display of names');
    I.click('Last name, First name', '.io-ox-contacts-settings');

    // Go back to contacts app and verify it
    I.openApp('Address Book');
    contacts.waitForApp(true);
    I.wait(1); //wait for listeners to be attached
    I.click('.selectable.contact');
    I.waitForElement(lastNameLocator.before(firstNameLocator).as(`'${lastName}, ${firstName}'`), 5, '.fullname');
});
