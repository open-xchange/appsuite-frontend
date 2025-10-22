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
    await I.haveAttachment('contacts', { id: contactResponse.id, folder: contact.folder_id }, 'media/mails/Virus_attached!.eml');
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

Scenario("Malformed URIs don't prevent drawing of other fields", async ({ I, contacts }) => {
    // alwaysVisible and optional fields
    const first = 'Phil';
    const last = 'Dunphy';
    const displayName = `${last}, ${first}`;
    await I.haveContact({
        display_name: displayName,
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: first,
        last_name: last,
        street_home: 'STREET_HOME',
        nickname: 'prof dr dr',
        url: 'http://example.com/abc%ichbinkeinezahl'
    });

    await I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // initial value
    I.waitForElement(`~${displayName}`);
    I.click(`~${displayName}`);
    I.waitForText('prof dr dr', 10, '.contact-detail');
    I.waitForText('http://example.com/abc%ichbinkeinezahl', 10, '.contact-detail');
});
