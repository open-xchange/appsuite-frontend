/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

const { I, dialogs } = inject();

module.exports = {
    waitForApp(isContactsFolder = false) {
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        var listenerID;
        // TODO make this work without stupid parameter (didn't want to make this async)
        // there is no redraw when current folder is already 'Contacts' so no need to wait for it
        if (!isContactsFolder) listenerID = I.registerNodeRemovalListener('.io-ox-contacts-window .classic-toolbar');
        I.selectFolder('Contacts');
        if (!isContactsFolder) I.waitForNodeRemoval(listenerID);
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
    },
    selectContact(text) {
        I.waitForElement('.vgrid [aria-label="' + text + '"]');
        I.click('.vgrid [aria-label="' + text + '"]');
        I.waitForElement('.contact-header');
        I.waitForText(text, 5, '.contact-header .fullname');
    },
    newAddressbook(name) {
        I.click('Add new address book');
        I.clickDropdown('Personal address book');
        dialogs.waitForVisible();
        I.fillField('[placeholder="New address book"][type="text"]', name);
        dialogs.clickButton('Add');
        I.waitForDetached('.modal-dialog');
    },
    newContact() {
        I.waitForDetached('.dropdown-toggle.disabled');
        I.clickToolbar('New contact');
        I.clickDropdown('New contact');
        I.waitForText('Add personal info');
    },
    newDistributionlist() {
        I.waitForDetached('.dropdown-toggle.disabled');
        I.clickToolbar('New contact');
        I.clickDropdown('New distribution list');
        I.waitForText('Participants');
    },
    addContactsField(fieldType, field, input) {
        I.click({ css: `div.dropdown[data-add="${fieldType}"] button` }, '.contact-edit');
        //I.click(`Add ${fieldType}`);
        I.waitForVisible('.dropdown.open .dropdown-menu');
        I.click(field);
        I.waitForText(field, 30, '.contact-edit');
        if (input) I.fillField(field, input);
    },
    editMyContact() {
        I.waitForVisible('.dropdown-toggle[aria-label="My account"]');
        I.waitForVisible('.contact-picture');
        I.click('.contact-picture');
        I.waitForText('Edit personal data', 30, '.dropdown.open .dropdown-menu');
        I.click('Edit personal data', '.dropdown.open .dropdown-menu');
        I.waitForVisible('.io-ox-contacts-edit-window');
    }
};
