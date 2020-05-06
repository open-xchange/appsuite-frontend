const { I } = inject();

module.exports = {
    // use xPath to locate foremost modal-dialog in case there are several open
    locators: {
        main: locate({ xpath: './/*[contains(@class, "modal-dialog") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Main'),
        header: locate({ xpath: './/*[contains(@class, "modal-header") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Header'),
        body: locate({ xpath: './/*[contains(@class, "modal-body") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Body'),
        footer: locate({ xpath: './/*[contains(@class, "modal-footer") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Footer')
    },

    clickButton(label) {
        const buttonLocator = locate({ xpath: `.//*[contains(@class, "modal-footer") and not(ancestor::*[contains(@style, "display: none;")])]//button[contains(., '${label}')]` }).as(label);

        // wait for button to be clickable
        I.waitForVisible(buttonLocator);
        I.waitForEnabled(buttonLocator, 10);
        I.click(label, this.locators.footer);
    },

    waitForVisible() {
        // wait for modal dialog to be visible and ready
        I.waitForVisible(this.locators.main, 15);
        I.waitForInvisible({ xpath: './/*[contains(@class, "modal-dialog") and not(ancestor::*[contains(@style, "display: none;")]) and descendant-or-self::*[contains(@class, "io-ox-busy")]]' }, 30);
    }
};
