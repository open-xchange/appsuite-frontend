/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

const expect = require('chai').expect;

Before(async ({ users }) => {
    await users.create(); // Sender
    await users.create(); // Recipient
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[OXUIB-587] Supports predefined values (plaintext)', async ({ I, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    const DATA = {
        subject: 'OXUIB-587',
        content: 'Supports predefined values',
        contentType: 'text/plain'
    };

    await I.executeAsyncScript(function (DATA, done) {
        require(['io.ox/mail/compose/main'], function (compose) {
            var app = compose.getApp();
            app.launch().done(function () {
                app.open(DATA).done(done);
            });
        });
    }, DATA);

    // check prefilled fields
    I.seeInField('Subject', DATA.subject);
    I.seeInField({ css: 'textarea.plain-text' }, DATA.content);
});

Scenario('[OXUIB-587] Supports predefined values (html)', async ({ I, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    const DATA = {
        subject: 'OXUIB-587',
        content: '<b>Supports predefined values</b>',
        contentType: 'text/html'
    };

    await I.executeAsyncScript(function (DATA, done) {
        require(['io.ox/mail/compose/main'], function (compose) {
            var app = compose.getApp();
            app.launch().done(function () {
                app.open(DATA).done(done);
            });
        });
    }, DATA);

    // check prefilled fields
    I.seeInField('Subject', DATA.subject);
    I.waitForElement('.editor iframe');
    within({ frame: '.editor iframe' }, () => {
        I.see('Supports predefined values');
        I.dontSee(DATA.content);
    });
});

Scenario('[C12122] Auto-size recipient fields', async function ({ I, mail }) {
    let height;

    I.login('app=io.ox/mail');
    mail.newMail();

    height = await I.grabCssPropertyFrom({ css: '[data-extension-id="to"]' }, 'height');
    expect(parseInt(height, 10)).to.be.most(40);

    I.click({ css: '[placeholder="To"]' });
    for (let i = 0; i < 5; i++) {
        I.fillField('To', `testmail${i}@testmail.com`);
        I.pressKey('Enter');
        I.wait(0.2);
    }

    height = await I.grabCssPropertyFrom({ css: '[data-extension-id="to"]' }, 'height');
    expect(parseInt(height, 10)).to.be.greaterThan(40);

    for (let i = 1; i < 5; i++) {
        I.click('~Remove', `~testmail${i}@testmail.com`);
    }

    height = await I.grabCssPropertyFrom({ css: '[data-extension-id="to"]' }, 'height');
    expect(parseInt(height, 10)).to.be.most(40);

});

Scenario('[Bug 62794] no drag and drop of pictures while composing a new mail', async function ({ I, mail }) {

    I.login();
    mail.newMail();
    I.waitForElement('.editor iframe');

    await I.dropFiles('e2e/media/files/generic/contact_picture.png', '.io-ox-mail-compose .editor .inplace-dropzone');

    within({ frame: '.editor iframe' }, () => {
        I.waitForElement('body img');
    });
});

Scenario('[C271752] Reduce image size for image attachments in mail compose', async ({ I, mail, users }) => {
    let [sender, recipient] = users;

    // enable Image resize setting
    await I.haveSetting('io.ox/mail//features/imageResize', true);

    // Login as 'sender'
    I.login('app=io.ox/mail', { user: sender });

    // compose mail
    mail.newMail();
    I.fillField('To', recipient.get('primaryEmail'));
    I.fillField('Subject', 'Reduced Image size Test');
    I.say('📢 add local file', 'blue');

    // attach Image
    I.attachFile('.composetoolbar input[type="file"]', 'e2e/media/placeholder/1030x1030.png');
    I.waitForDetached('.io-ox-fileselection');

    // switch Image size
    I.waitForText('Original');
    I.click('Image size: Original');
    I.click('Small (320 px)');
    I.dontSee('Original');

    // send Mail to 'recipient' and logout
    mail.send();
    I.logout();

    /////////////////// Continue as 'recipient' ///////////////////////
    // Log in as second user and navigate to mail app
    I.login('app=io.ox/mail', { user: recipient });

    I.waitForText('Reduced Image size Test');

    // Open mail
    mail.selectMail('Reduced Image size Test');

    // Verify Attachment
    I.waitForText('1 attachment');
    I.click('1 attachment');
    I.see('1030x1030.png');

    // Let's view the content
    I.click('1030x1030.png');
    I.waitForElement('.dropdown.open');
    I.click('View', '.dropdown.open .dropdown-menu');
    I.waitForText('Shares', 20);
});
