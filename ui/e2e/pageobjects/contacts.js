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
