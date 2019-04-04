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

Feature('Mail > View');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7816] HTML/Plain-text mail', async (I, users) => {

    var icke = users[0].userdata.email1;

    await I.haveMail({
        attachments: [{
            content: '<span style="color: red">Span with red color</span><br><table><tr><td>Table</td></tr></table>',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [['Icke', icke]],
        subject: 'Allow HTML formatting',
        to: [['Icke', icke]]
    });

    // turn off HTML formatting
    await testCycle(false, async function () {
        I.waitForElement('.mail-detail-content');
        I.seeNumberOfElements('.mail-detail-content > div', 2);
        I.seeTextEquals('Span with red color\nTable', '.mail-detail-content');
    });

    // turn on HTML formatting
    await testCycle(true, async function () {
        I.waitForElement('.mail-detail-content');
        I.seeNumberOfElements('.mail-detail-content > span[style]', 1);
        I.seeNumberOfElements('.mail-detail-content > br', 1);
        I.seeNumberOfElements('.mail-detail-content > table', 1);
        I.seeTextEquals('Span with red color\nTable', '.mail-detail-content');
    });

    async function testCycle(flag, callback) {
        // toggle HTML formatting
        await I.haveSetting({ 'io.ox/mail': { allowHtmlMessages: flag } });
        I.login('app=io.ox/mail');
        // wait for first email
        var firstItem = '.list-view .list-item';
        I.waitForElement(firstItem);
        I.click(firstItem);
        I.waitForVisible('.thread-view.list-view .list-item');
        // check content
        within({ frame: '.mail-detail-frame' }, callback);
        I.logout();
    }
});
