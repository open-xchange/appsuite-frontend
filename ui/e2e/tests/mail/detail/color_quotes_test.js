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

const expect = require('chai').expect;

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7819] Color quotes on reply', async ({ I, users, mail }) => {

    var icke = users[0].userdata.email1;

    await I.haveMail({
        attachments: [{
            content: '<p>Level 0</p><blockquote type="cite"><p>Level 1</p><blockquote type="cite"><p>Level 2</p><blockquote type="cite"><p>Level 3</p></blockquote></blockquote></blockquote>',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [['Icke', icke]],
        subject: 'RE: Color quotes on reply',
        to: [['Icke', icke]]
    });

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // wait for first email
    mail.selectMail('RE: Color quotes on reply');

    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, async function () {
        let rule = await I.grabCssPropertyFrom('blockquote', 'color');
        rule = Array.isArray(rule) ? rule : [rule];
        [rule] = rule.map(c => c.indexOf('rgba') === 0 ? c : c.replace('rgb', 'rgba').replace(')', ', 1)'));
        expect(rule).to.equal('rgba(85, 85, 85, 1)');
        rule = await I.grabCssPropertyFrom('blockquote blockquote', 'color');
        rule = Array.isArray(rule) ? rule : [rule];
        [rule] = rule.map(c => c.indexOf('rgba') === 0 ? c : c.replace('rgb', 'rgba').replace(')', ', 1)'));
        expect(rule).to.equal('rgba(40, 63, 115, 1)');
        rule = await I.grabCssPropertyFrom('blockquote blockquote blockquote', 'color');
        rule = Array.isArray(rule) ? rule : [rule];
        [rule] = rule.map(c => c.indexOf('rgba') === 0 ? c : c.replace('rgb', 'rgba').replace(')', ', 1)'));
        expect(rule).to.equal('rgba(221, 8, 128, 1)');
    });
});
