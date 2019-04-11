/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 * @author David Bauer <david.bauer@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Compose');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C8821] Send mail with Hyperlink', function (I) {

    let hyperLink = 'https://foo.bar';
    let linkText = 'appsuite link';
    I.login('app=io.ox/mail');
    I.clickToolbar('Compose');
    I.waitForFocus('input[type="email"].token-input.tt-input');
    I.fillField('input[type="email"].token-input.tt-input', 'foo@bar');
    I.wait(1);
    I.fillField('input[name="subject"]', 'test subject');
    I.click('i.mce-i-link');
    I.waitForVisible('.mce-reset');
    I.fillField('.mce-combobox input.mce-textbox', hyperLink);
    I.fillField('input.mce-last', linkText);
    I.click('Ok');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText(linkText);
        I.click(linkText);
    });
    I.click('i.mce-i-link');
    I.waitForVisible('.mce-reset');
    I.seeInField('.mce-combobox input.mce-textbox', hyperLink);
    I.seeInField('input.mce-last', linkText);
    I.click('Ok');
    I.click('Send');
    I.wait(1);
    I.selectFolder('Sent');
    I.waitForText('test subject');
    I.click('li[data-index="0"]');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText(linkText);
        I.click(linkText);
    });
    I.amOnPage(hyperLink);
});

Scenario('[C8822] Send Mail with Hyperlink from existing text', function (I) {
    I.login('app=io.ox/mail');
    I.clickToolbar('Compose');
    I.waitForFocus('input[type="email"].token-input.tt-input');
    I.fillField('input[type="email"].token-input.tt-input', 'foo@bar');
    I.wait(1);
    I.fillField('input[name="subject"]', 'test subject');
    within({ frame: '#mce_0_ifr' }, () => {
        I.fillField('.mce-content-body', 'testlink');
        I.doubleClick('div.default-style');
    });
    I.click('i.mce-i-link');
    I.waitForVisible('.mce-reset');
    I.fillField('.mce-combobox input.mce-textbox', 'http://foo.bar');
    I.click('Ok');
    within({ frame: '#mce_0_ifr' }, () => {
        I.seeElement('a');
    });
    I.click('Send');
    I.wait(1);
    I.selectFolder('Sent');
    I.waitForText('test subject');
    I.click('li[data-index="0"]');
    I.waitForText('testlink', '.rightside.mail-detail-pane .body.user-select-text');
});

Scenario('[C8823] Send Mail with Hyperlink by typing the link', function (I) {
    // test String has to contain whitespace at the end for URL converting to work
    const testText = 'Some test text https://foo.bar  ';
    I.login('app=io.ox/mail');
    I.clickToolbar('Compose');
    I.waitForFocus('input[type="email"].token-input.tt-input');
    I.fillField('input[type="email"].token-input.tt-input', 'foo@bar');
    I.wait(1);
    I.fillField('input[name="subject"]', 'test subject');
    within({ frame: '#mce_0_ifr' }, () => {
        I.fillField('.mce-content-body', testText);
        I.seeElement('a');
    });
    I.click('Send');
    I.wait(1);
    I.selectFolder('Sent');
    I.waitForText('test subject');
    I.click('li[data-index="0"]');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText(testText);
        I.seeElement('a[href="https://foo.bar"]');
    });
});

Scenario('[C8824] Remove hyperlinks', async function (I) {
    const iframeLocator = '.io-ox-mail-compose-window .editor iframe';
    const defaultText = 'Dies ist ein testlink http://example.com.';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');

    I.retry(5).click('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');
    I.click('~Maximize');

    I.waitForFocus('input[placeholder="To"]');
    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.pressKey(defaultText);
        I.pressKey('Enter');
        I.see('http://example.com', 'a');
        I.pressKey('ArrowLeft');
        I.pressKey('ArrowLeft');
        I.pressKey('ArrowLeft');
    });

    I.click('.mce-btn[data-name="link"]');
    I.pressKey(['Control', 'a']);
    I.pressKey('Delete');
    I.pressKey('Enter');

    await within({ frame: iframeLocator }, async () => {
        I.dontSeeElement('a');
    });
});
