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

Feature('Contacts > Detail');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Displays only fields with content', async function ({ I, contacts }) {
    // alwaysVisible and optional fields
    const first = 'Phil',
        last = 'Dunphy',
        display_name = `${last}, ${first}`;
    await I.haveContact({
        display_name: display_name,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: first,
        last_name: last,
        street_home: 'STREET_HOME'
    });

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // initial value
    I.waitForElement(`~${display_name}`);
    I.click(`~${display_name}`);
    I.waitForText('Home address', 5, '.contact-detail');
    I.waitForText('STREET_HOME', 5, '.contact-detail');

    // remove value
    I.retry(5).click('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.fillField('Email 1', 'email1@test');
    I.fillField('street_home', '');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.waitForElement('.fa-spin-paused');

    // check detail view
    I.click('.io-ox-contacts-window .leftside');
    I.pressKey('End');
    I.pressKey('Enter');
    I.waitForVisible('.io-ox-contacts-window .leftside .vgrid-cell.selected');
    I.waitForText(display_name, 5, '.contact-detail');
    I.waitForText('email1@test', 5, '.contact-detail');
    I.dontSee('Home address', '.contact-detail');
    I.dontSee('street_home', '.contact-detail');
});

Scenario.skip('[C273805] - Download infected file', async function ({ I }) {
    const testrailID = 'C273805';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID

    };
    const contactResponse = await I.haveContact(contact);
    await I.haveAttachment('contacts', { id: contactResponse.id, folder: contact.folder_id }, 'e2e/media/mails/Virus_attached!.eml');
    I.login('app=io.ox/contacts');
    I.waitForElement('.vgrid-cell.contact');
    I.selectFolder('Contacts');
    I.waitForElement(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.waitForElement(locate('.dropdown').withText('Virus_attached!.eml').inside('.contact-header'));
    I.click(locate('.dropdown').withText('Virus_attached!.eml').inside('.contact-header'));
    I.waitForElement(locate('[data-action="io.ox/core/tk/actions/download-attachment"]').withText('Download').inside('.dropdown.open'));
    I.click(locate('[data-action="io.ox/core/tk/actions/download-attachment"]').withText('Download').inside('.dropdown.open'));
    I.waitForElement(locate('.modal-open .modal-title').withText('Malicious file detected'));
    I.waitForElement(locate('.modal-open button').withText('Download infected file'));
    I.waitForElement(locate('.modal-open button').withText('Cancel'));
});
