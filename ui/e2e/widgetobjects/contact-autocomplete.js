const { I } = inject();


module.exports = {

    locators: {
        suggestion: locate({ css: '.tt-dropdown-menu .tt-suggestion:nth-of-type(1)' }).as('First suggestion'),
        suggestions: locate({ css: '.tt-dropdown-menu' }).as('Suggestion dropdown')
    },

    selectFirst() {
        I.waitForVisible(this.locators.suggestion, 5);
        I.waitForEnabled(this.locators.suggestion, 5);
        I.click(this.locators.suggestion);
        I.waitForInvisible(this.locators.suggestions);
    }
};
