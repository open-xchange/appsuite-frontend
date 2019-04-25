/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Markus Wagner <markus.wagner@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

const { expect } = require('chai');

Feature('Mail > Compose');

Before(async (users) => {
    await users.create(); // Sender
    await users.create(); // Recipient
});

After(async (users) => {
    await users.removeAll();
});

const iframeLocator = '.io-ox-mail-compose-window .editor iframe';
Scenario('[C7392] Send mail with different text highlighting', async function (I, users) {

    const selectInline = (action) => {
        I.click(locate('button').withChild(locate('span').withText('Formats')));
        I.waitForElement((locate('span').withText('Inline')).inside('.mce-floatpanel'));
        I.click(locate('span.mce-text').withText('Inline'));
        I.click(locate('span.mce-text').withText(action));
        I.waitForInvisible('.mce-floatpanel');
    };

    let [sender, recipient] = users;

    const mailSubject = 'C7392 Different text highlighting';

    const defaultText = 'This text has no style.';
    const textBold = 'This is bold text!';
    const textItalic = 'This is italic text?';
    const textUnderline = 'This is underlined text.';
    const textStrikethrough = 'This is striked through text.';
    const textSuperscript = 'This text is displayed UP';
    const textSubscript = 'And down...';
    const textCode = 'And code formatting!';
    const textChanged = 'This text was changed and should have no style!';
    const textBoldItalicSuperscript = 'This text combined several styles.';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail', { user: sender });

    // Open the mail composer
    I.retry(5).click('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');
    I.click('~Maximize');

    // Fill out to and subject
    I.waitForFocus('input[placeholder="To"]');
    I.fillField('To', recipient.get('primaryEmail'));
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.pressKey(defaultText);
        I.pressKey('Enter');
    });

    // Write some text in bold
    selectInline('Bold');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textBold);
        I.pressKey('Enter');
    });
    selectInline('Bold');

    // Write some text in italic
    selectInline('Italic');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textItalic);
        I.pressKey('Enter');
    });
    selectInline('Italic');

    // Write some text which is underlined
    selectInline('Underline');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textUnderline);
        I.pressKey('Enter');
    });
    selectInline('Underline');

    // Write some striked through text
    selectInline('Strikethrough');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textStrikethrough);
        I.pressKey('Enter');
    });
    selectInline('Strikethrough');

    // Write some sup text
    selectInline('Superscript');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textSuperscript);
        I.pressKey('Enter');
    });
    selectInline('Superscript');

    // Write some sub text
    selectInline('Subscript');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textSubscript);
        I.pressKey('Enter');
    });
    selectInline('Subscript');

    // Write some code
    selectInline('Code');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textCode);
        I.pressKey('Enter');
    });
    selectInline('Code');

    // Write some text, format it and remove the style
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textChanged);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });
    selectInline('Bold');
    selectInline('Underline');
    selectInline('Subscript');
    selectInline('Subscript');
    selectInline('Underline');
    selectInline('Bold');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
        I.pressKey('Enter');
    });

    // Write some text bold + italic + superscript
    selectInline('Bold');
    selectInline('Italic');
    selectInline('Superscript');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textBoldItalicSuperscript);
        I.pressKey('Enter');
    });

    // Send the mail
    I.click('Send');

    // Let's stick around a bit for sending to finish
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.logout();

    // Log in as second user and navigate to mail app
    I.login('app=io.ox/mail', { user: recipient });

    // Open the mail
    I.waitForText(mailSubject, 2);
    I.retry(5).click(locate('.list-item').withText(mailSubject).inside('.list-view'));
    I.waitForVisible('iframe.mail-detail-frame');

    await within({ frame: '.mail-detail-frame' }, async () => {
        expect(await I.grabAttributeFrom(locate('div').withText(defaultText), 'style')).to.have.lengthOf(0);
        I.waitForElement(locate('strong').withText(textBold));
        I.waitForElement(locate('em').withText(textItalic));
        expect((await I.grabCssPropertyFrom(locate('span').withText(textUnderline), 'text-decoration')).join()).to.include('underline');
        expect((await I.grabCssPropertyFrom(locate('span').withText(textStrikethrough), 'text-decoration')).join()).to.include('line-through');
        I.waitForElement(locate('sup').withText(textSuperscript));
        I.waitForElement(locate('sub').withText(textSubscript));
        I.waitForElement(locate('code').withText(textCode));
        expect(await I.grabAttributeFrom(locate('div').withText(textChanged), 'style')).to.have.lengthOf(0);
        I.waitForElement((locate('strong').withText(textBoldItalicSuperscript)).inside('em').inside('sup'));
    });
});
