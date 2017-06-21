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

    var signatures = [
        'The content of the first signature',
        'The content of the second signature',
        'The content of the third signature',
        'The content of the fourth signature'
    ];

    function selectAndAssertSignature(client, index, test) {
        client
            .clickWhenVisible('.io-ox-mail-compose-window .signatures span')
            .clickWhenVisible(util.format('.dropdown.open li:nth-child(%s) a', index + 1));

        if (test instanceof RegExp) {
            client.assert.propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                test
            );
        } else {
            client.assert.valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                test
            );
        }
    }

    it('compose new mail with signature above correctly placed and changed', function (client) {
        client
            .login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' })
            .waitForElementVisible('.io-ox-mail-window', 20000)
            .setSetting('io.ox/mail', 'defaultSignature', '0')
            .setSetting('io.ox/mail', 'messageFormat', 'text');

        client
            // clicked on a-tag with label "Compose"
            .clickWhenEventListener('.io-ox-mail-window a[data-action="compose"]', 'click', 20000)
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 5000)
            // check if first signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[0])
            );

        selectAndAssertSignature(client, 2, util.format('\n\n%s', signatures[1]));
        selectAndAssertSignature(client, 3, util.format('\n\n%s', signatures[2]));
        selectAndAssertSignature(client, 4, util.format('\n\n%s', signatures[3]));
        selectAndAssertSignature(client, 0, '');
        selectAndAssertSignature(client, 1, util.format('\n\n%s', signatures[0]));

        // insert some text
        client
            .moveTo('.io-ox-mail-compose textarea.plain-text', 2, 2)
            .mouseButtonClick()
            .keys('some user input')
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('some user input\n\n%s', signatures[0])
            );

        selectAndAssertSignature(client, 2, util.format('some user input\n\n%s', signatures[1]));
        selectAndAssertSignature(client, 3, util.format('some user input\n\n%s', signatures[2]));
        selectAndAssertSignature(client, 4, util.format('some user input\n\n%s', signatures[3]));
        selectAndAssertSignature(client, 0, 'some user input');
        selectAndAssertSignature(client, 1, util.format('some user input\n\n%s', signatures[0]));

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .clickWhenVisible('.io-ox-dialog-popup button[data-action="delete"]')
            .waitForElementVisible('.io-ox-mail-window', 5000);

        client.logout();
    });

    it('compose new mail with signature below correctly placed initially', function (client) {
        client
            .login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' })
            .waitForElementVisible('.io-ox-mail-window', 20000)
            .setSetting('io.ox/mail', 'defaultSignature', '2')
            .setSetting('io.ox/mail', 'messageFormat', 'text');

        client
            // clicked on a-tag with label "Compose"
            .clickWhenEventListener('.io-ox-mail-window a[data-action="compose"]', 'click', 20000)
            .waitForElementVisible('.io-ox-mail-compose textarea.plain-text', 5000)
            // check if third signature is selected correctly
            .assert
            .valueContains(
                '.io-ox-mail-compose textarea.plain-text',
                util.format('\n\n%s', signatures[2])
            );

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .clickWhenVisible('.io-ox-dialog-popup button[data-action="delete"]')
            .waitForElementVisible('.io-ox-mail-window', 5000);

        client.logout();
    });

    it('Reply to mail with signature above correctly placed and changed', function (client) {
        client
            .login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' })
            .waitForElementVisible('.io-ox-mail-window', 20000)
            .setSetting('io.ox/mail', 'defaultReplyForwardSignature', '0')
            .setSetting('io.ox/mail', 'messageFormat', 'text');

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
                new RegExp(util.format('^\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0]))
            );

        selectAndAssertSignature(client, 2, new RegExp(util.format('^\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[1])));
        selectAndAssertSignature(client, 3, new RegExp(util.format('^\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[2])));
        selectAndAssertSignature(client, 4, new RegExp(util.format('^\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[3])));
        selectAndAssertSignature(client, 0, /^\n\n(>[^\n]*(\n)?)+$/);
        selectAndAssertSignature(client, 1, new RegExp(util.format('^\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0])));

        // insert some text
        client
            .moveTo('.io-ox-mail-compose textarea.plain-text', 2, 2)
            .mouseButtonClick()
            .keys('some user input')
            .assert
            .propRegexp(
                '.io-ox-mail-compose textarea.plain-text',
                'value',
                new RegExp(util.format('^some user input\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0]))
            );

        selectAndAssertSignature(client, 2, new RegExp(util.format('^some user input\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[1])));
        selectAndAssertSignature(client, 3, new RegExp(util.format('^some user input\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[2])));
        selectAndAssertSignature(client, 4, new RegExp(util.format('^some user input\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[3])));
        selectAndAssertSignature(client, 0, /^some user input\n\n(>[^\n]*(\n)?)+$/);
        selectAndAssertSignature(client, 1, new RegExp(util.format('^some user input\\n\\n%s\\n\\n(>[^\\n]*(\\n)?)+$', signatures[0])));

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .clickWhenVisible('.io-ox-dialog-popup button[data-action="delete"]')
            .waitForElementVisible('.io-ox-mail-window', 5000);

        client.logout();
    });

    it('reply to mail with signature below correctly placed initially', function (client) {
        client
            .login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' })
            .waitForElementVisible('.io-ox-mail-window', 20000)
            .setSetting('io.ox/mail', 'defaultReplyForwardSignature', '2')
            .setSetting('io.ox/mail', 'messageFormat', 'text');

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
                new RegExp(util.format('^\\n\\n(>[^\\n]*(\\n)?)+\\n\\n%s$', signatures[2]))
            );

        // discard mail
        client
            .clickWhenVisible('.io-ox-mail-compose-window button[data-action="discard"]')
            .clickWhenVisible('.io-ox-dialog-popup button[data-action="delete"]')
            .waitForElementVisible('.io-ox-mail-window', 5000);

        client.logout();
    });

});
