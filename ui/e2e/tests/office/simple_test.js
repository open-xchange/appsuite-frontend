/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 */

/// <reference path="../../steps.d.ts" />

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C9999] simple test', async function (I, users) {

    // TBD ====================================================================
    // to be moved to an actor helper module

    // common -----------------------------------------------------------------

    /**
     * Waits for the specified Documents Portal application.
     *
     * @param {AppType} appType
     *  The type of the Documents Portal application.
     *
     * @param {number} [timeout=5]
     *  The maximum number of *seconds* to wait for the Portal application.
     */
    I.waitForDocumentsPortal = function (appType, timeout) {
        this.waitForVisible(`.io-ox-office-portal-${appType}-window`, timeout || 5);
    };

    /**
     * Extension of the `I.login()` method that switches to the specified
     * Documents Portal application after logging in.
     *
     * @param {AppType} appType
     *  The type of the Documents Portal application.
     *
     * @param {object} users
     *  The user to be logged in.
     */
    I.loginToDocumentsPortal = function (appType, user) {
        this.login(`app=io.ox/office/portal/${appType}`, { user });
        this.waitForDocumentsPortal(appType);
    };

    /**
     * Switches to the specified tool pane.
     *
     * @param {string} paneId
     *  The identifier of the tool pane to be activated.
     */
    I.seeToolPane = function (paneId) {
        I.click(`.io-ox-office-main .top-pane .group[data-key="view/toolbars/tab"] a[data-value="${paneId}"]`);
    };

    /**
     * Presses the button with the specified controller item key.
     *
     * @param {string} itemKey
     *  The key of the controller item associated with the button.
     */
    I.clickButton = function (itemKey) {
        I.click(`.io-ox-office-main .group[data-key="${itemKey}"] a`);
    };

    // OX Text ----------------------------------------------------------------

    /**
     * Types the passed text into the page, and waits for the text to appear.
     * Additionally, waits for the "All changes saved" application state.
     *
     * @param {string} text
     *  The text to be written into the document page.
     */
    I.typeText = function (text) {
        I.type(text, 10);
        I.waitForText(text, 1, '.page.edit-mode');
        // TODO: use DOM selector
        I.waitForText('All changes saved');
    };

    // ========================================================================

    // login and wait for the "Text Portal" app to appear
    I.loginToDocumentsPortal('text', users[0]);

    // click the "Blank text document" button to create a new text document
    I.waitForVisible('a.template-item.blank-doc');
    I.click('a.template-item.blank-doc');

    // wait for the new browser tab to appear
    I.wait(1);
    I.retry().switchToNextTab();

    // wait for the top navigation bar, and for the text page to be editable
    I.waitForVisible('#io-ox-appcontrol', 10);
    I.waitForVisible('.io-ox-office-text-main .page.edit-mode', 15);

    // activate the "Format" toolpane
    I.seeToolPane('format');

    // type some text into the page, wait for the text to be saved to server
    I.typeText('This is a test paragraph.');

    // press the "Bold" button
    I.clickButton('character/bold');

    // type more text into the page, wait for the text to be saved to server
    I.typeText(' Bold text.');

    // close the document, and wait for the Portal app in the browser tab
    I.clickButton('app/quit');
    I.waitForDocumentsPortal('text');
});
