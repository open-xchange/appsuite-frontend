/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
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
