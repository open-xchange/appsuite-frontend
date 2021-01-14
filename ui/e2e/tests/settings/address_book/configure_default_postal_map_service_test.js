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
 * @author Markus Wagner <markus.wagner@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Settings > Address Book');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C85624] Configure postal addresses map service', async ({ I, contacts }) => {

    const verifyMapType = async function (mapName, link, value, isContactsFolder = false) {
        // Go back to settings and switch to other display style
        I.openApp('Settings', { folder: 'virtual/settings/io.ox/contacts' });
        I.waitForText('Link postal addresses with map service');
        I.waitForText(mapName);
        I.checkOption(`.io-ox-contacts-settings input[value="${value}"]`);
        I.seeCheckboxIsChecked(`.io-ox-contacts-settings input[value="${value}"]`);

        // Verify the displayed style
        I.openApp('Address Book');
        contacts.waitForApp(isContactsFolder);
        contacts.selectContact('Bar, Foo');

        if (mapName !== 'No link') {
            I.waitForText('Open in ' + mapName);
            const href = await I.grabAttributeFrom('.maps-service', 'href');
            expect(Array.isArray(href) ? href[0] : href).to.include(link);
        } else {
            I.dontSee('Open in');
        }
    };

    await I.haveSetting('io.ox/tours//server/disableTours', true);
    await I.haveContact({
        folder_id: `${await I.grabDefaultFolder('contacts')}`,
        last_name: 'Bar',
        first_name: 'Foo ',
        street_home: 'Wulle Wulle 0815',
        city_home: '1337 Örtlichkeit',
        state_home: 'Ist Egal',
        postal_code_home: '4711',
        country_home: 'Amazing'
    });

    I.login();

    I.say('Google Maps');
    verifyMapType('Google Maps', 'google.com', 'google');
    I.say('Open Street Map');
    verifyMapType('Open Street Map', 'openstreetmap.org', 'osm', true);
    I.say('No link');
    await verifyMapType('No link', '', 'none', true);
});
