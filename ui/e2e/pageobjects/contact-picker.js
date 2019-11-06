const { I } = inject();


module.exports = {

    locators: {
        popup: locate({ css: '.addressbook-popup' }).as('Addressbook Popup'),
        searchfield: locate({ css: '.addressbook-popup .search-field' }).as('Search field'),
        results: locate({ css: '.addressbook-popup' }).find({ css: '.list-item' }).as('Results')
    },

    ready() {
        I.waitForVisible(this.locators.popup, 5);
    },

    add(name) {
        this.ready();
        this.search(name);
        this.selectFirst();
    },

    search(query) {
        // custom helper doesn't support locators yet
        I.waitForFocus('.addressbook-popup .search-field');
        I.fillField(this.locators.searchfield, query);
        I.waitForVisible(this.locators.results);
    },

    selectFirst() {
        I.click(this.locators.results.first().as('First list item'));
        I.waitForVisible(locate({ css: '.list-item.selected' }).as('Selected list item'));
    },

    close() {
        I.click('Select');
        I.waitToHide(this.locators.popup);
    }
};
