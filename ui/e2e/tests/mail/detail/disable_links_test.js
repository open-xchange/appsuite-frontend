/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C114335] Links in emails can be disabled on a per-folder basis', async ({ I, users }) => {

    var icke = users[0].userdata.email1;

    await I.haveMail({
        attachments: [{
            content: 'Lorem ipsum <a href="https://www.example.com/">example.com</a>.',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [['Icke', icke]],
        subject: 'Disable links',
        to: [['Icke', icke]]
    });

    // turn links OFF
    await testCycle(true, async function () {
        I.waitForElement('.mail-detail-content.disable-links');
        I.seeNumberOfElements('.mail-detail-content > a[disabled]', 1);
    });

    // turn links ON
    await testCycle(false, async function () {
        I.waitForElement('.mail-detail-content:not(.disable-links)');
        I.seeNumberOfElements('.mail-detail-content > a:not([disabled])', 1);
    });

    async function testCycle(flag, callback) {
        // toggle HTML formatting
        await I.haveSetting({ 'io.ox/mail': { maliciousCheck: flag } });
        I.login('app=io.ox/mail');
        // injecting "maliciousFolders" does not work
        I.executeScript(function (flag) {
            require('io.ox/mail/util').isMalicious = _.constant(flag);
        }, flag);
        // wait for first email
        var firstItem = '.list-view .list-item';
        I.waitForElement(firstItem);
        I.click(firstItem);
        I.waitForVisible('.thread-view.list-view .list-item');
        I.waitForVisible('.mail-detail-frame');
        // check content
        within({ frame: '.mail-detail-frame' }, callback);
        I.logout();
    }
});
