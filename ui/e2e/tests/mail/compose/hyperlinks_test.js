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

Feature('Mail Compose');

const { expect } = require('chai');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8821] Send mail with Hyperlink', async function ({ I, mail }) {

    let hyperLink = 'https://foo.bar';
    let linkText = 'appsuite link';
    I.login('app=io.ox/mail');
    mail.newMail();
    I.fillField('To', 'foo@bar');
    I.fillField('Subject', 'test subject');
    I.click({ css: 'i.mce-i-link' });
    I.waitForVisible('.mce-reset');
    I.fillField('.mce-combobox input.mce-textbox', hyperLink);
    I.fillField({ css: 'input.mce-last' }, linkText);
    I.click('Ok');
    I.waitForVisible('#mce_0_ifr');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText(linkText);
        I.click(linkText);
    });
    I.click({ css: 'i.mce-i-link' });
    I.waitForVisible('.mce-reset');
    I.seeInField('.mce-combobox input.mce-textbox', hyperLink);
    I.seeInField({ css: 'input.mce-last' }, linkText);
    I.click('Ok');
    mail.send();
    I.selectFolder('Sent');
    mail.selectMail('test subject');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText(linkText);
        I.click(linkText);
    });
    // sometimes it takes a little while to open the link
    let i = 0;
    for (i; i < 30 && (await I.grabNumberOfOpenTabs()) < 2; i++) {
        I.wait(0.1);
    }
    expect(i + 1, 'number of open tabs is 2 within 1s').to.be.below(10);
});

Scenario('[C8822] Send Mail with Hyperlink from existing text', function ({ I, mail }) {
    I.login('app=io.ox/mail');
    mail.newMail();
    I.fillField('To', 'foo@bar');
    I.fillField('Subject', 'test subject');
    within({ frame: '#mce_0_ifr' }, () => {
        I.fillField('.mce-content-body', 'testlink');
        I.doubleClick({ css: 'div.default-style' });
    });
    I.click({ css: 'i.mce-i-link' });
    I.waitForVisible('.mce-reset');
    I.fillField('.mce-combobox input.mce-textbox', 'http://foo.bar');
    I.click('Ok');
    within({ frame: '#mce_0_ifr' }, () => {
        I.seeElement('a');
    });
    mail.send();
    I.selectFolder('Sent');
    I.waitForText('test subject', 30, '.list-view li[data-index="0"]');
    I.click('.list-view li[data-index="0"]');
    I.waitForText('testlink', 5, '.rightside.mail-detail-pane .body.user-select-text');
});

Scenario('[C8823] Send Mail with Hyperlink by typing the link', function ({ I, mail }) {
    // test String has to contain whitespace at the end for URL converting to work
    const testText = 'Some test text https://foo.bar  ';
    I.login('app=io.ox/mail');
    mail.newMail();
    I.fillField('To', 'foo@bar');
    I.fillField('Subject', 'test subject');
    I.wait(0.5);
    within({ frame: '#mce_0_ifr' }, () => {
        I.fillField('.mce-content-body', testText);
        I.seeElement('a');
    });
    mail.send();
    I.selectFolder('Sent');
    I.waitForText('test subject', 30, '.list-view li[data-index="0"]');
    I.click('.list-view li[data-index="0"]');
    I.waitForVisible('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText(testText.trim());
        I.seeElement({ css: 'a[href="https://foo.bar"]' });
    });
});

Scenario('[C8824] Remove hyperlinks', async function ({ I, mail }) {
    const iframeLocator = '.io-ox-mail-compose-window .editor iframe';
    const defaultText = 'Dies ist ein testlink http://example.com.';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');
    mail.newMail();

    I.click('~Maximize');

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.fillField({ css: 'body' }, defaultText);
        I.pressKey('Enter');
        I.see('http://example.com', 'a');
        I.pressKey('ArrowLeft');
        I.pressKey('ArrowLeft');
        I.pressKey('ArrowLeft');
    });

    I.click('.mce-btn[data-name="link"]');
    // Using "Url" here does not work in selenium because broken tinymce DOM
    I.fillField(locate('.mce-floatpanel input').at(1), '');
    I.pressKey('Enter');

    await within({ frame: iframeLocator }, async () => {
        I.dontSeeElement('a');
    });
});
