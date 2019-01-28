
//const actor = require('@open-xchange/codecept-helper').actor;
const I = actor();

module.exports = {

  // setting locators
  fields: {
    search: 'input[type="search"]',
  },

  // introducing methods
  doSearch(query) {
    I.click('.search-box')
    //Workaround for clear searchbox
    I.pressKey(['Control','a']);
    I.pressKey('Backspace');
    I.fillField(this.fields.search, query);
    I.pressKey("Enter");
    I.seeElement('.search-box span[title="'+query+'"]')
    I.waitForElement('.fa-spin-paused');
  }
}