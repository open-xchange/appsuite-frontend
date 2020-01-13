const { I } = inject();

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
        I.waitForElement('.modal-body');
        I.fillField('[placeholder="New address book"][type="text"]', name);
        I.click('Add');
        I.waitForDetached('.modal-body');
    },
    newContact() {
        I.waitForDetached('.dropdown-toggle.disabled');
        I.waitForText('New contact', 30, '.classic-toolbar-visible .dropdown-toggle');
        I.click('New contact', '.classic-toolbar-visible .dropdown-toggle');
        I.waitForText('New contact', 30, '.dropdown.open .dropdown-menu');
        I.click('New contact', '.dropdown.open .dropdown-menu');
        I.waitForText('Add personal info');
    },
    newDistributionlist() {
        I.waitForDetached('.dropdown-toggle.disabled');
        I.waitForText('New contact', 30, '.classic-toolbar-visible .dropdown-toggle');
        I.click('New contact', '.classic-toolbar-visible .dropdown-toggle');
        I.waitForText('New distribution list', 30, '.dropdown.open .dropdown-menu');
        I.click('New distribution list', '.dropdown.open .dropdown-menu');
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
        I.waitForVisible('.dropdown-toggle[aria-label="Support"]');
        I.waitForVisible('.contact-picture');
        I.click('.contact-picture');
        I.waitForText('My contact data', 30, '.dropdown.open .dropdown-menu');
        I.click('My contact data', '.dropdown.open .dropdown-menu');
        I.waitForVisible('.io-ox-contacts-edit-window');
    },
    editMyContactPhoto() {
        this.editMyContact();
        I.waitForElement('.contact-edit .contact-photo');
        I.click('.contact-edit .contact-photo');
        I.waitForVisible('.edit-picture');
    }
};
