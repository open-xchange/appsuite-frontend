/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Detail');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

// TODO: introduce helper?
function getTestMail(user, content) {
    return {
        attachments: [{
            content: content,
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Mail Detail Misc',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    };
}

Scenario('[C83388] Visual indicator for blocked images', async function (I, users) {
    I.haveSetting('io.ox/mail//allowHtmlImages', false);
    // dependes on mail?action=get-param "view: noimg"
    let [user] = users;
    const style = 'repeating-linear-gradient';
    await I.haveMail(getTestMail(user, '<p style="background-color:#ccc"><img src="/appsuite/apps/themes/default/logo.png" height="200" width="200" src="" alt="C83388"></p>'));
    I.login('app=io.ox/mail');

    I.waitForVisible('.io-ox-mail-window');
    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');

    I.say('check image placeholder style', 'blue');
    within({ frame: '.mail-detail-frame' }, async function () {
        // check for 'stripes style"
        const [rule] = await I.grabCssPropertyFrom('img[data-original-src], img[src]', 'background-image');
        expect(rule).to.contain(style);
    });

    I.say("click on 'show images'", 'blue');
    I.click('.external-images > button');

    I.say('check image', 'blue');
    within({ frame: '.mail-detail-frame' }, async function () {
        // check for 'stripes style"
        const [rule] = await I.grabCssPropertyFrom('img[data-original-src], img[src]', 'background-image');
        expect(rule).not.to.contain(style);
    });
});
