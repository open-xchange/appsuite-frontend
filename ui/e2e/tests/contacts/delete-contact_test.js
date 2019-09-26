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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7366] Multiple contacts', async function (I, search) {
    const testrailID = 'C7366';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID
    };
    await I.haveContact(contact);
    await I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    search.doSearch(testrailID + ' ' + testrailID);
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.fa-spin-paused');
    I.pressKey(['\uE009', 'a']);
    //I.pressKey(['Control', 'a']);
    I.waitForElement('.fa-spin-paused');
    I.clickToolbar('Delete');
    I.waitForVisible('.modal-dialog');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.dontSee('C7367, C7367');
});

Scenario('[C7367] Single Contact', async function (I) {
    const testrailID = 'C7367';
    const contact = {
        display_name: testrailID + ', ' + testrailID,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID

    };
    await I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');
    I.waitForVisible('.classic-toolbar [data-action]');
    I.selectFolder('Contacts');
    I.waitForElement('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.click('[aria-label="' + testrailID + ', ' + testrailID + '"]');
    I.waitForElement('.contact-header');
    I.waitForText(testrailID + ', ' + testrailID, 5, '.contact-header .fullname');
    I.clickToolbar('Delete');
    I.waitForVisible('.modal-dialog');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('[aria-label="' + testrailID + ', ' + testrailID + '"]');
});
