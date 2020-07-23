
const { I } = inject();

module.exports = {

    locators: {
        box: locate({ css: '.search-box' }).as('Search box'),
        field: locate({ css: 'input[type="search"]' }).as('Search field'),
        cancel: locate({ css: '.search-box button.action-cancel' }).as('Cancel'),
        options: locate({ css: '.search-box button.action-options' }).as('Options'),
        dropdown: locate({ css: '.search-box .dropdown' }).as('Options dropdown')
    },

    waitForWidget() {
        I.click(this.locators.box);
        I.waitForVisible(this.locators.field);
        I.retry(5).click(this.locators.field);
        I.wait(0.5);
    },

    doSearch(query) {
        I.retry(5).fillField(this.locators.field, query);
        I.waitForElement(`[data-query="${query}"]`);
        I.pressKey('Enter');
        I.waitForVisible(this.locators.box.find({ css: `span[title="${query}"]` }).as(`Result for ${query}`), 5);
        I.waitForElement('.fa-spin-paused');
    },

    cancel() {
        I.retry(5).click(this.locators.cancel);
        I.waitToHide(this.locators.cancel);
    },

    option(label, option) {
        I.click(this.locators.options);
        I.waitForVisible(this.locators.dropdown);
        I.see(label);
        I.selectOption(label, option);
        if (option !== 'More…') I.waitForElement('.search-field.focus');
    }
};
