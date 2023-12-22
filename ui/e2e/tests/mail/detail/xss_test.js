/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
    await I.haveMail(getTestMail(user, '<p><a href="http://qwe&quot;-alert(document.domain)-&quot;">XSS_ME</a></p>'));
    I.login('app=io.ox/mail');
    mail.waitForApp();
    // click on first email
    mail.selectMail('Test subject');
    I.waitForElement('.mail-detail-frame');

    I.switchTo({ frame: '.mail-detail-frame' });
    I.waitForText('XSS_ME');
    const link = await I.grabHTMLFrom(locate('p').withDescendant(locate('a').withText('XSS_ME')).as('link'));
    expect(link).to.equal('<a target="_blank" href="http://qwe%22-alert(document.domain)-%22" rel="noopener">XSS_ME</a>');
});

Scenario('urls should not be double encoded', async function ({ I, users, mail }) {
    // See Bug 58333
    let [user] = users;
    await I.haveMail(getTestMail(user, '<p><a href="http://localhost/?test=ajlksd89123jd9hnasdf%3D&action=test">XSS_ME</a></p>'));
    I.login('app=io.ox/mail');
    mail.waitForApp();
    // click on first email
    mail.selectMail('Test subject');
    I.waitForElement('.mail-detail-frame');

    I.switchTo({ frame: '.mail-detail-frame' });
    I.waitForText('XSS_ME');

    let href = await I.grabAttributeFrom(locate('a').withText('XSS_ME'), 'href');
    href = href instanceof Array && href.length === 1 ? href[0] : href;
    expect(href).to.equal('http://localhost/?test=ajlksd89123jd9hnasdf%3D&action=test');
});
