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

describe('Mail', function () {

    describe('Compose', function () {

        // https://testrail.open-xchange.com/index.php?/cases/view/7382
        it('Compose plain text mail', function (client) {
            // 0) log in to settings and set compose mode to html
            client
                .login('app=io.ox/settings')
                .waitForElementVisible('.io-ox-settings-main', 20000);

            // open mail settings
            client.selectFolder({ id: 'virtual/settings/io.ox/mail' });

            // set compose mode to html
            client.clickWhenVisible('.io-ox-mail-settings input[value="html"]', 2500);

            // 1) Switch to the mail app, select "Create mail"
            client
                .clickWhenVisible('.launchers li[data-app-name="io.ox/mail"]')
                .assert.containsText('*[data-app-name="io.ox/mail"]', 'Mail');

            // 1.1) Mark all messages as read to identify the new message later on
            client
                .selectFolder({ id: 'default0/INBOX' })
                .openFolderContextMenu({ id: 'default0/INBOX' })
                .clickWhenVisible('.dropdown.open a[data-action="markfolderread"]');

            // 1.2) continue opening mail compose
            client.waitForElementVisible('.io-ox-mail-window .window-body .classic-toolbar a[data-action="compose"]', 20000)
                .assert.containsText('.io-ox-mail-window .window-body .classic-toolbar a[data-action="compose"]', 'Compose')
                .clickWhenEventListener('.io-ox-mail-window .window-body  .classic-toolbar a[data-action="compose"]', 'click', 2500)
                .waitForElementVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor', 20000)
                .pause(1000)
                .assert.title('App Suite. Compose');

            // 2) Select "Plain Text" as text format under "Options"
            client
                .clickWhenVisible('.io-ox-mail-compose div[data-extension-id="composetoolbar-menu"] .dropdown:not(.security-options):not(.signatures) > a', 2000)
                .clickWhenVisible('.dropdown.open a[data-name="editorMode"][data-value="text"]', 2000)
                .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 20000)
                .waitForElementNotVisible('.io-ox-mail-compose .editable-toolbar', 2000);

            // 3) Set a recipient, add a subject and mail text
            client
                .insertMailaddress('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 0)
                .setValue('.io-ox-mail-compose div[data-extension-id="subject"] input', 'Test subject')
                .setValue('.io-ox-mail-compose textarea.plain-text', 'Test text')
                .assert.value('.io-ox-mail-compose textarea.plain-text', 'Test text');

            // 4) Send the E-Mail and check it as recipient
            client
                .click('.io-ox-mail-compose-window .window-footer button[data-action="send"]')
                .waitForElementVisible('.io-ox-mail-window .leftside ul li.unread', 20000)
                .click('.io-ox-mail-window .leftside ul li.unread')
                .waitForElementVisible('.io-ox-mail-window .mail-detail-pane .subject', 1000)
                .assert.containsText('.io-ox-mail-window .mail-detail-pane .subject', 'Test subject');

            // 4.1) Assert body content
            client
                .shadowWaitForElementVisible('.io-ox-mail-window .mail-detail-pane .body::shadow .mail-detail-content', 2500)
                .assert.shadowContainsText('.io-ox-mail-window .mail-detail-pane .body::shadow .mail-detail-content', 'Test text');

            // 5) Check the "Sent" folder
            client
                .selectFolder({ title: 'Sent objects' })
                .clickWhenVisible('.io-ox-mail-window .leftside ul li.list-item', 2500)
                .waitForElementVisible('.io-ox-mail-window .mail-detail-pane .subject', 1000)
                .assert.containsText('.io-ox-mail-window .mail-detail-pane .subject', 'Test subject');

            // 5.1) Assert body content
            client
                .shadowWaitForElementVisible('.io-ox-mail-window .mail-detail-pane .body::shadow .mail-detail-content', 2500)
                .assert.shadowContainsText('.io-ox-mail-window .mail-detail-pane .body::shadow .mail-detail-content', 'Test text');

            client.logout();
        });

    });

});
