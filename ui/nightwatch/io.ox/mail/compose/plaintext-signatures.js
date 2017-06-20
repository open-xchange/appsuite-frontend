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

var util = require('util');

describe('Mail Compose plain text signatures', function () {

    var signatures = [{
        title: 'First signature above',
        content: 'The content of the first signature',
        placement: 'above'
    }, {
        title: 'Second signature above',
        content: 'The content of the second signature',
        placement: 'above'
    }, {
        title: 'First signature below',
        content: 'The content of the third signature',
        placement: 'below'
    }, {
        title: 'Second signature below',
        content: 'The content of the fourth signature',
        placement: 'below'
    }];

    /*
     * Nightwatch.js seems to have a problem if you click through the UI in before/after blocks.
     * For this suite, we use the first and the last test to do preparations and cleanup
     */
    it('creates four signatures', function (client) {
        // login
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000);

        // open mail settings
        client.selectFolder({ id: 'virtual/settings/io.ox/mail' });

        // set compose mode to html
        client.clickWhenVisible('.io-ox-mail-settings input[value="text"]', 2500);

        // open signature settings
        client.selectFolder({ id: 'virtual/settings/io.ox/mail/settings/signatures' });

        // create test signatures
        for (var i in signatures) {
            var signature = signatures[i];
            client
                // clicked on button-tag with label "Add new signature"
                .clickWhenVisible('.io-ox-signature-settings button')
                .setValue('.io-ox-dialog-popup #signature-name', signature.title)
                .setValue('.io-ox-signature-edit', signature.content)
                .click(util.format('.io-ox-dialog-popup #signature-position option[value=%s]', signature.placement))
                // clicked on span-tag with label "Save"
                .clickWhenVisible('.io-ox-dialog-popup button[data-action="save"]')
                .waitForElementNotPresent('.io-ox-dialog-wrapper', 2500);
        }

        // switch to mail app
        client.clickWhenVisible('.launchers li[data-app-name="io.ox/mail"]');

        // Mark all messages as read to identify the new message later on
        client
            .selectFolder({ id: 'default0/INBOX' })
            .openFolderContextMenu({ id: 'default0/INBOX' })
            .clickWhenVisible('.dropdown.open a[data-action="markfolderread"]');

        // open mail compose
        client
            .setSetting('io.ox/mail', 'messageFormat', 'html')
            .clickWhenEventListener('.io-ox-mail-window .window-body  .classic-toolbar a[data-action="compose"]', 'click', 2500)
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor', 20000);

        // Set a recipient, add a subject and mail text
        client
            .insertMailaddress('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', 0)
            .setValue('.io-ox-mail-compose div[data-extension-id="subject"] input', 'Test subject')
            .setValue('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor .editable', 'Test text');

        // Send the E-Mail and check it as recipient
        client
            .click('.io-ox-mail-compose-window .window-footer button[data-action="send"]')
            .waitForElementVisible('.io-ox-mail-window .leftside ul li.unread', 20000)
            .click('.io-ox-mail-window .leftside ul li.unread')
            .waitForElementVisible('.io-ox-mail-window .mail-detail-pane .subject', 1000)
            .assert.containsText('.io-ox-mail-window .mail-detail-pane .subject', 'Test subject');

        // Assert body content
        client
            .shadowWaitForElementVisible('.io-ox-mail-window .mail-detail-pane .body::shadow .mail-detail-content', 2500)
            .assert.containsText('.mail-detail-pane h1', 'Test subject');

        client.logout();
    });

    it('compose new mail with signature above correctly placed and changed', function (client) {
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000);

        // open signature settings
        client
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .selectFolder({ id: 'virtual/settings/io.ox/mail/settings/signatures' });

        // select third signature as default signature
        // (nth-child starts counting at one and at first position is 'no signature')
        client.clickWhenVisible('.io-ox-signature-settings #defaultSignature option:nth-child(2)', 2500);

        // switch to mail app
        client.clickWhenVisible('.launchers li[data-app-name="io.ox/mail"]');

        client
            // clicked on a-tag with label "Compose"
            .clickWhenEventListener('.io-ox-mail-window a[data-action="compose"]', 'click', 20000)
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 5000)
            // check if first signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[0].content)
            );

        // select second signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(3) a')
            // check if second signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[1].content)
            );

        // select third signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(4) a')
            // check if third signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[2].content)
            );

        // select fourth signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(5) a')
            // check if fourth signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[3].content)
            );

        // select no signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(1) a')
            // check if no signature is selected correctly
            .assert
            .valueContains('.io-ox-mail-compose textarea.plain-text', '');

        // select first signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(2) a')
            // check if first signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[0].content)
            );

        // insert some text
        client
            .moveTo('.io-ox-mail-compose textarea.plain-text', 2, 2)
            .mouseButtonClick()
            .keys('some user input')
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('some user input\n\n%s', signatures[0].content)
            );

        // select second signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(3) a')
            // check if second signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('some user input\n\n%s', signatures[1].content)
            );

        // select third signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(4) a')
            // check if third signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('some user input\n\n%s', signatures[2].content)
            );

        // select fourth signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(5) a')
            // check if fourth signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('some user input\n\n%s', signatures[3].content)
            );

        // select no signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(1) a')
            // check if no signature is selected correctly
            .assert.valueContains('.io-ox-mail-compose textarea.plain-text', 'some user input');

        // select first signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(2) a')
            // check if first signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('some user input\n\n%s', signatures[0].content)
            );

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .clickWhenVisible('.io-ox-dialog-popup button[data-action="delete"]')
            .waitForElementVisible('.io-ox-mail-window');

        client.logout();
    });

    it('compose new mail with signature below correctly placed initially', function (client) {
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000);

        // open signature settings
        client
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .selectFolder({ id: 'virtual/settings/io.ox/mail/settings/signatures' });

        // select third signature as default signature
        // (nth-child starts counting at one and at first position is 'no signature')
        client.clickWhenVisible('.io-ox-signature-settings #defaultSignature option:nth-child(4)', 2500);

        // switch to mail app
        client.clickWhenVisible('.launchers li[data-app-name="io.ox/mail"]');

        client
            // clicked on a-tag with label "Compose"
            .clickWhenEventListener('.io-ox-mail-window a[data-action="compose"]', 'click', 20000)
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 5000)
            // check if third signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[2].content)
            );

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .waitForElementVisible('.io-ox-mail-window');

        client.logout();
    });

    it('Reply to mail with signature above correctly placed and changed', function (client) {
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000);

        // open signature settings
        client
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .selectFolder({ id: 'virtual/settings/io.ox/mail/settings/signatures' });

        // select first signature as default signature
        // (nth-child starts counting at one and at first position is 'no signature')
        client.clickWhenVisible('.io-ox-signature-settings #defaultReplyForwardSignature option:nth-child(2)', 2500);

        // switch to mail app
        client.clickWhenVisible('.launchers li[data-app-name="io.ox/mail"]');

        // click on first email
        client
            .clickWhenVisible('.io-ox-mail-window .leftside ul li.list-item', 5000)
            .waitForElementVisible('.io-ox-mail-window .mail-detail-pane .subject', 1000)
            .assert.containsText('.io-ox-mail-window .mail-detail-pane .subject', 'Test subject');

        // reply to that mail
        client
            .clickWhenVisible('.io-ox-mail-window .window-content a[data-action="more"]')
            .clickWhenVisible('.dropdown.open a[data-action="reply"]')
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 5000)
            // check if first signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0].content))
            );

        // select second signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(3) a')
            // check if second signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[1].content))
            );

        // select third signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(4) a')
            // check if third signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[2].content))
            );

        // select fourth signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(5) a')
            // check if fourth signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[3].content))
            );

        // select no signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(1) a')
            // check if no signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                /^\n\n(>[^\n]*(\n)?)+$/
            );

        // select first signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(2) a')
            // check if first signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0].content))
            );

        // insert some text
        client
            .moveTo('.io-ox-mail-compose textarea.plain-text', 2, 2)
            .mouseButtonClick()
            .keys('some user input')
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^some user input\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0].content))
            );

        // select second signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(3) a')
            // check if second signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^some user input\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[1].content))
            );

        // select third signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(4) a')
            // check if third signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^some user input\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[2].content))
            );

        // select fourth signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(5) a')
            // check if fourth signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^some user input\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[3].content))
            );

        // select no signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(1) a')
            // check if no signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                /^some user input\n\n(>[^\n]*(\n)?)+$/
            );

        // select first signature
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible('.dropdown.open li:nth-child(2) a')
            // check if first signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^some user input\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0].content))
            );

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .clickWhenVisible('.io-ox-dialog-popup button[data-action="delete"]')
            .waitForElementVisible('.io-ox-mail-window');

        client.logout();
    });

    it('reply to mail with signature below correctly placed initially', function (client) {
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000);

        // open signature settings
        client
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .selectFolder({ id: 'virtual/settings/io.ox/mail/settings/signatures' });

        // select third signature as default signature
        // (nth-child starts counting at one and at first position is 'no signature')
        client.clickWhenVisible('.io-ox-signature-settings #defaultReplyForwardSignature option:nth-child(4)', 2500);

        // switch to mail app
        client.clickWhenVisible('.launchers li[data-app-name="io.ox/mail"]');

        // click on first email
        client
            .clickWhenVisible('.io-ox-mail-window .leftside ul li.list-item', 2500)
            .waitForElementVisible('.io-ox-mail-window .mail-detail-pane .subject', 1000)
            .assert.containsText('.io-ox-mail-window .mail-detail-pane .subject', 'Test subject');

        // reply to that mail
        client
            .clickWhenVisible('.io-ox-mail-window .window-content a[data-action="more"]')
            .clickWhenVisible('.dropdown.open a[data-action="reply"]')
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 5000)
            // check if third signature is selected correctly
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[2].content))
            );

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .waitForElementVisible('.io-ox-mail-window');

        client.logout();
    });

    /*
     * Use this as after function to remove the signatures.
     */
    it('removes all signatures', function (client) {
        // login
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000);

        // open signature settings
        client
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .selectFolder({ id: 'virtual/settings/io.ox/mail/settings/signatures' });

        // remove the signatures which were created in the first test
        client
            .waitForElementVisible('#io-ox-topbar-dropdown-icon', 25000)
            .click('#io-ox-topbar-dropdown-icon > a.dropdown-toggle')
            .clickWhenVisible('.dropdown.open a[data-action="settings"]', 2500);

        for (var i = 0; i < signatures.length; i++) {
            client
                .clickWhenVisible('.io-ox-signature-settings a[data-action="delete"]')
                .pause(100);
        }

        client.assert.elementNotPresent('.io-ox-signature-settings a[data-action="delete"]');

        client.logout();
    });

});
