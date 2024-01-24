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

/// <reference path="../../steps.d.ts" />

Feature('Contacts > Search');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});


Scenario('[C7369] by Name', async function ({ I, search, contacts }) {
    const testrailID = 'C7369';
    const contact = {
        display_name: testrailID + ', ' + testrailID,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    search.doSearch(testrailID + ' ' + testrailID);
    I.waitForText(testrailID, 5, '.vgrid-cell');
});

Scenario('[C7370] by Phone numbers', async function ({ I, search, contacts }) {
    const phone = '+4917113371337';
    const testrailID = 'C7370';
    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: phone
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    search.doSearch(phone);

    I.waitForText(testrailID, 5, '.vgrid-cell');
});

Scenario('[C7371] by Addresses', async function ({ I, search, contacts }) {
    const testrailID = 'C7371';
    const firstname = testrailID;
    const lastname = testrailID;

    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID,
        cellular_telephone1: '+4917113371337',
        street_home: 'street_home',
        post_code_home: '1337',
        city_home: 'city_home',
        state_home: 'state_home',
        country_home: 'country_home'
    };
    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    search.doSearch(contact.street_home);
    I.waitForText(firstname, 5, '.vgrid-cell');
    I.waitForText(lastname, 5, '.vgrid-cell');
    search.doSearch(contact.post_code_home);
    I.waitForText(firstname, 5, '.vgrid-cell');
    I.waitForText(lastname, 5, '.vgrid-cell');
    search.doSearch(contact.city_home);
    I.waitForText(firstname, 5, '.vgrid-cell');
    I.waitForText(lastname, 5, '.vgrid-cell');
    search.doSearch(contact.state_home);
    I.waitForText(firstname, 5, '.vgrid-cell');
    I.waitForText(lastname, 5, '.vgrid-cell');
    search.doSearch(contact.country_home);
    I.waitForText(firstname, 5, '.vgrid-cell');
    I.waitForText(lastname, 5, '.vgrid-cell');
});
