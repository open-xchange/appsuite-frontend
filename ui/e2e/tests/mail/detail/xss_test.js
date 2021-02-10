/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Detail');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

function getTestMail(user, content) {
    return {
        attachments: [{
            content,
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    };
}

Scenario('double quoted urls are escaped properly', async function ({ I, users, mail }) {
    // See Bug 57692
    let [user] = users;
    await I.haveMail(getTestMail(user, '<p><a href="http://qwe&quot;-alert(document.domain)-&quot;">XSSME</a></p>'));
    I.login('app=io.ox/mail');
    mail.waitForApp();
    // click on first email
    mail.selectMail('Test subject');
    I.waitForElement('.mail-detail-frame');

    I.switchTo({ frame: '.mail-detail-frame' });
    I.waitForText('XSSME');

    let href = await I.grabAttributeFrom(locate('a').withText('XSSME'), 'href');
    href = href instanceof Array && href.length === 1 ? href[0] : href;
    expect(href).to.equal('http://qwe%22-alert%28document.domain%29-%22/');
});

Scenario('urls should not be double encoded', async function ({ I, users, mail }) {
    // See Bug 58333
    let [user] = users;
    await I.haveMail(getTestMail(user, '<p><a href="http://localhost/?test=ajlksd89123jd9hnasdf%3D&action=test">XSSME</a></p>'));
    I.login('app=io.ox/mail');
    mail.waitForApp();
    // click on first email
    mail.selectMail('Test subject');
    I.waitForElement('.mail-detail-frame');

    I.switchTo({ frame: '.mail-detail-frame' });
    I.waitForText('XSSME');

    let href = await I.grabAttributeFrom(locate('a').withText('XSSME'), 'href');
    href = href instanceof Array && href.length === 1 ? href[0] : href;
    expect(href).to.equal('http://localhost/?test=ajlksd89123jd9hnasdf%3D&action=test');
});
