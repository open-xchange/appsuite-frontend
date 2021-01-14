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

Feature('Contacts > Delete');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7366] Multiple contacts', async function ({ I, search, contacts, dialogs }) {
    const testrailID = 'C7366';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID
    };
    await Promise.all([
        I.haveContact(contact),
        I.haveContact(contact)
    ]);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    search.doSearch(testrailID + ' ' + testrailID);
    I.click('~' + testrailID + ', ' + testrailID);
    I.waitForElement('.fa-spin-paused');
    I.click('.select-all');
    I.waitForElement('.fa-spin-paused');
    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.waitForInvisible('.io-ox-busy');
    I.dontSee('C7367, C7367');
});

Scenario('[C7367] Single Contact', async function ({ I, contacts, dialogs }) {
    const testrailID = 'C7367',
        displayName = testrailID + ', ' + testrailID,
        contact = {
            display_name: displayName,
            folder_id: await I.grabDefaultFolder('contacts'),
            first_name: testrailID,
            last_name: testrailID
        };

    await I.haveContact(contact);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    contacts.selectContact(displayName);

    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached({ css: '[aria-label="' + displayName + '"]' });
});
