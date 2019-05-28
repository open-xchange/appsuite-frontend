
//const actor = require('@open-xchange/codecept-helper').actor;
const I = actor();

module.exports = {

    // setting locators
    fields: {
        search: 'input[type="search"]'
    },

    // introducing methods
    doSearch(query) {
        I.click('.search-box');
        I.waitForElement(this.fields.search);
        I.fillField(this.fields.search, query);
        I.pressKey('Enter');
        I.seeElement('.search-box span[title="' + query + '"]');
        I.waitForElement('.fa-spin-paused');
    }
};
