const { I } = inject();

module.exports = {

    locators: {
        tree: locate({ css: '.io-ox-settings-window .leftside .tree-container' }).as('Tree'),
        main: locate({ css: '.io-ox-settings-window .rightside' }).as('Main content'),
        dialog: locate({ css: '.modal[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' }).as('Create/Edit dialog'),
        lastaction: locate({ css: '.io-ox-mailfilter-edit .actions > li:last-of-type' }).as('Last action')
    },

    connectYourDevice: function () {
        I.waitForVisible('#io-ox-topbar-settings-dropdown-icon');
        I.click('#io-ox-topbar-settings-dropdown-icon');
        I.waitForVisible(locate('a')
            .withAttr({ 'data-action': 'client-onboarding' })
            .inside('#topbar-settings-dropdown'));
        I.click('Connect your Device', '#topbar-settings-dropdown');
        I.waitForText('Please select the platform of your device.');
    },

    settings: function () {
        I.waitForVisible('#io-ox-topbar-settings-dropdown-icon');
        I.click('#io-ox-topbar-settings-dropdown-icon');
        I.waitForVisible('[data-name="settings-app"]', '#topbar-settings-dropdown');
        I.click('[data-name="settings-app"]', '#topbar-settings-dropdown');
        I.waitForVisible('.settings-container');
    },

    tours: function name() {
        I.waitForVisible('#io-ox-topbar-help-icon');
        I.click('#io-ox-topbar-help-icon');
        I.waitForText('Getting started');
        I.click('Getting started', '#topbar-help-dropdown');
        // test cancel mechanism
        I.waitForElement('.wizard-container .wizard-content');
    },

    help: function name() {
        I.waitForElement('#io-ox-topbar-help-dropdown-icon');
        I.click('#io-ox-topbar-help-dropdown-icon .dropdown-toggle');
        I.waitForElement('.io-ox-context-help', '#topbar-help-dropdown');
        I.click('.io-ox-context-help', '#topbar-help-dropdown');
        I.waitForElement('.io-ox-help-window');
        I.waitForVisible('.inline-help-iframe');
    }

};
