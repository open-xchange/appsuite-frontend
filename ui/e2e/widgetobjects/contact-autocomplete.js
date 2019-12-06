const { I } = inject();


module.exports = {

    locators: {
        suggestion: locate({ css: '.tt-dropdown-menu .tt-suggestion:nth-of-type(1)' }).as('First suggestion'),
        suggestions: locate({ css: '.tt-dropdown-menu' }).as('Suggestion dropdown')
    },

    select(elementName, within) {
        let context = within === '*' ? '//span[@class="tt-dropdown-menu"]' : `//div[contains(@class, "${within}")]//span[@class="tt-dropdown-menu"]`;

        I.waitForText(elementName, 10, context);
        I.wait(1);

        // searched entry could be a resource or user where the DOM structure differs
        I.retry(5).click(`${context}//div[@class="participant-name"]/strong[text()="${elementName}"]|` +
            `//div[@class="participant-email"]/span/strong[text()="${elementName}"]`);
    },

    selectFirst() {
        I.waitForVisible(this.locators.suggestion, 5);
        I.waitForEnabled(this.locators.suggestion, 5);
        I.click(this.locators.suggestion);
        I.waitForInvisible(this.locators.suggestions);
    }
};
