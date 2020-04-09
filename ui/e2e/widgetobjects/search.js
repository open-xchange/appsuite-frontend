
const { I } = inject();

module.exports = {

    locators: {
        box: locate({ css: '.search-box' }).as('Search box'),
        field: locate({ css: 'input[type="search"]' }).as('Search field')
    },

    // introducing methods
    doSearch(query) {
        I.click(this.locators.box);
        I.waitForVisible(this.locators.field);
        I.fillField(this.locators.field, query);
        I.pressKey('Enter');
        I.waitForVisible(this.locators.box.find({ css: `span[title="${query}"]` }).as(`Result for ${query}`), 5);
        I.waitForElement('.fa-spin-paused');
    }
};
