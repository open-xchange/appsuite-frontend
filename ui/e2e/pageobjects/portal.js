const { I, dialogs } = inject();

module.exports = {

    locators: {
        addWidget: locate({ css: 'button.add-widget' }).as('Add Widget'),
        dropdown: locate({ css: '.io-ox-portal-settings-dropdown' }).as('Dropdown'),
        list: locate({ css: '.widgets' }).as('Widget list')
    },

    waitForApp() {
        I.waitForVisible({ css: '.io-ox-portal' });
        I.waitForText('Add widget', 10, '.io-ox-portal');
    },

    openDropdown() {
        I.click(this.locators.addWidget);
        I.waitForVisible(this.locators.dropdown);
    },

    addWidget(name) {
        this.openDropdown();
        I.click(`${name}`, this.locators.dropdown);
        if (name === 'Inbox') {
            dialogs.waitForVisible();
            dialogs.clickButton('Save');
        }
        I.waitForElement(`~${name}`);
    }

};
