const { I } = inject();

module.exports = {
    newContact() {
        I.waitForDetached('.dropdown-toggle.disabled');
        I.waitForText('New contact', 5, '.classic-toolbar-visible .dropdown-toggle');
        I.click('New contact', '.classic-toolbar-visible .dropdown-toggle');
        I.waitForText('New contact', 5, '.dropdown.open .dropdown-menu');
        I.click('New contact', '.dropdown.open .dropdown-menu');
        I.waitForText('Add personal info');
    },
    newDistributionlist() {
        I.waitForDetached('.dropdown-toggle.disabled');
        I.waitForText('New contact', 5, '.classic-toolbar-visible .dropdown-toggle');
        I.click('New contact', '.classic-toolbar-visible .dropdown-toggle');
        I.waitForText('New distribution list', 5, '.dropdown.open .dropdown-menu');
        I.click('New distribution list', '.dropdown.open .dropdown-menu');
        I.waitForText('Participants');
    }
};
