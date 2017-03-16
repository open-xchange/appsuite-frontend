/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

describe('Mail compose', function () {

    it('opens mail compose', function (client) {
        client
            .login('app=io.ox/mail')
            .waitForElementVisible('*[data-app-name="io.ox/mail"]', 20000)
            .assert.containsText('*[data-app-name="io.ox/mail"]', 'Mail');

        // wait for toolbar with compose button to appear
        client
            .waitForElementVisible('.io-ox-mail-window .window-body > .classic-toolbar-container a[data-action=compose]', 20000)
            .assert.containsText('.io-ox-mail-window .window-body > .classic-toolbar-container a[data-action=compose]', 'Compose');

        // open mail compose in plain text mode
        client
            .require(['settings!io.ox/mail'], function (settings) {
                settings.set('messageFormat', 'text');
            })
            .waitForElementEventListener('.io-ox-mail-window .window-body > .classic-toolbar-container a[data-action=compose]', 'click', 2500)
            .click('.io-ox-mail-window .window-body > .classic-toolbar-container a[data-action=compose]');

        // wait for compose area to be visible
        client
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 20000)
            .pause(1000)
            .assert.title('App Suite. Compose');

        // set signature to none
        client
            .clickWhenVisible('.io-ox-mail-compose .dropdown.signatures > a[data-toggle="dropdown"]')
            .clickWhenVisible('.dropdown.open a[data-value=""]')
            .assert.value('.io-ox-mail-compose textarea.plain-text', '');

        // change to html editing
        client
            .clickWhenVisible('.io-ox-mail-compose div[data-extension-id="composetoolbar-menu"] .dropdown:last-child > a')
            .clickWhenVisible('.dropdown.open a[data-name="editorMode"][data-value="html"]')
            .waitForElementVisible('.io-ox-mail-compose .contenteditable-editor', 20000);

        // insert some text
        client
            .setValue('.io-ox-mail-compose .contenteditable-editor .editable.mce-content-body', 'Test')
            .assert.propEquals('.io-ox-mail-compose .contenteditable-editor .editable.mce-content-body', 'innerHTML', '<p>Test</p>');

        client.logout();
    });

});
