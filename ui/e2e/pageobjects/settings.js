const { I } = inject();

// data-point selectors for main content
const MAPPING = {
    'Basic Settings': 'io.ox/core/settings/detail/view',
    'Address Book': 'io.ox/contacts/settings/detail/view',
    'Calendar2': 'io.ox/calendar/settings/detail/view',
    'Drive': 'io.ox/files/settings/detail/view',
    'Mail': 'io.ox/mail/settings/detail/view',
    'Portal': 'io.ox/portal/settings/detail/view',
    'Tasks': 'io.ox/tasks/settings/detail/view'
};

module.exports = {

    locators: {
        tree: locate({ css: '.io-ox-settings-window .leftside .tree-container' }).as('Tree'),
        main: locate({ css: '.io-ox-settings-window .rightside' }).as('Main content')
    },

    waitForApp() {
        I.waitForNetworkTraffic();
        I.waitForElement(this.locators.tree);
        I.waitForElement(this.locators.main);
    },

    select(label) {
        const ID = MAPPING[label];
        I.waitForText(label, 5, this.locators.tree);
        I.click(label, this.locators.tree);
        I.waitForElement(ID ?
            this.locators.main.find(`.scrollable-pane > [data-point="${ID}"]`) :
            this.locators.main.find('h1').withText(label)
        );
    }
};
