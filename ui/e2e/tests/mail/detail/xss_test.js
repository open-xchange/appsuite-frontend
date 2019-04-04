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

Feature('Mail Detail View').tag('4');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
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

Scenario('double quoted urls are escaped properly', async function (I, users) {
    // See Bug 57692
    let [user] = users;
    await I.haveMail(getTestMail(user, '<p><a href="http://qwe&quot;-alert(document.domain)-&quot;">XSSME</a></p>'));
    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');
    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(await I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');
    within({ frame: '.mail-detail-frame' }, () => {
        I.click('XSSME');
    });
    I.wait(0.5);
    I.switchToNextTab();
    I.seeCurrentUrlEquals('http://qwe"-alert(document.domain)-"/');
    I.closeCurrentTab();
    I.logout();
});

Scenario('urls should not be double encoded', async function (I, users) {
    // See Bug 58333
    let [user] = users;
    await I.haveMail(getTestMail(user, '<p><a href="http://localhost/?test=ajlksd89123jd9hnasdf%3D&action=test">XSSME</a></p>'));
    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');
    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(await I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');
    within({ frame: '.mail-detail-frame' }, () => {
        I.click('XSSME');
    });
    I.wait(0.5);
    I.switchToNextTab();
    expect(await I.grabCurrentUrl()).to.equal('http://localhost/?test=ajlksd89123jd9hnasdf%3D&action=test');

    I.closeCurrentTab();
    I.logout();
});

