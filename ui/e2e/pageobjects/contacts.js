const { I } = inject();

module.exports = {
    waitForApp() {
        I.waitForElement('.fa-spin.fa-refresh');
        I.waitForElement('.fa-spin-paused.fa-refresh');
        I.selectFolder('Contacts');
        I.waitForDetached('.classic-toolbar [data-action="create"].disabled');
    },
    selectContact(text) {
        I.waitForElement('[aria-label="' + text + '"]');
        I.click('[aria-label="' + text + '"]');
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
    }
};
