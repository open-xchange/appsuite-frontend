const { I } = inject();

module.exports = {

    locators: {
        addWidget: locate({ css: 'button.add-widget' }).as('Add Widget'),
        dropdown: locate({ css: '.io-ox-portal-settings-dropdown' }).as('Dropdown'),
        list: locate({ css: '.widgets' }).as('Widget list')
    },

    ready() {
        I.waitForVisible({ css: '.io-ox-portal' });
    },

    openDropdown() {
        I.click(this.locators.addWidget);
        I.waitForVisible(this.locators.dropdown);
    },

    addWidget(name) {
        this.openDropdown();
        I.click(`${name}`, this.locators.dropdown);
        if (name === 'Inbox') {
            I.waitForVisible('.modal-dialog');
            I.click('Save');
        }
        I.waitForElement(`~${name}`);
    }

};
