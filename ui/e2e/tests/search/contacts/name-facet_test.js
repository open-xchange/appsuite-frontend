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
/// <reference path="../../../steps.d.ts" />

Feature('Search > Contacts');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7369] by Name', async function (I, search, contacts) {
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
