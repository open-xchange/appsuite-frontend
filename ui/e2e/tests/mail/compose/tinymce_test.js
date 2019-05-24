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

Feature('Mail Compose');

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

Scenario('[C7393] Send mail with bullet point and numbering - bullet points', async function (I, users) {

    let [sender, recipient] = users;

    const mailSubject = 'C7393 Different bullet points';

    const defaultText = 'This text has no alignment.';
    const textBullet1 = 'This is bullet point one.';
    const textBullet2 = 'This is bullet point two.';
    const textBullet21 = 'This bullet point is indented under point two!';
    const textBullet1_1 = 'And this is again on level one.';

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

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textBullet1);
    });

    I.click(locate('button').inside('~Bullet list'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey('Enter');
        I.pressKey(textBullet2);
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Increase indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textBullet21);
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Decrease indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textBullet1_1);
        I.pressKey('Enter');
        I.pressKey('Enter');
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
        I.waitForElement(locate('div').withText(defaultText));
        I.waitForElement((locate('li').inside('ul')).at(1).withText(textBullet1));
        I.waitForElement((locate('li').inside('ul')).at(2).withText(textBullet2));
        I.waitForElement((locate('li').withText(textBullet21)).inside('ul').inside('li').inside('ul'));
        I.waitForElement((locate('li').inside('ul')).at(3).withText(textBullet1_1));
    });
});

Scenario('[C7393] Send mail with bullet point and numbering - numbering', async function (I, users) {

    let [sender, recipient] = users;

    const mailSubject = 'C7393 Different numbering';

    const defaultText = 'This text has no alignment.';
    const textNumber1 = 'This is number one.';
    const textNumber2 = 'This is number two.';
    const textNumber21 = 'This number is indented under number two!';
    const textNumber1_1 = 'And this is again on level one with number 3.';

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

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textNumber1);
    });

    I.click(locate('button').inside('~Numbered list'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey('Enter');
        I.pressKey(textNumber2);
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Increase indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textNumber21);
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Decrease indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textNumber1_1);
        I.pressKey('Enter');
        I.pressKey('Enter');
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
        I.waitForElement(locate('div').withText(defaultText));
        I.waitForElement((locate('li').inside('ol')).at(1).withText(textNumber1));
        I.waitForElement((locate('li').inside('ol')).at(2).withText(textNumber2));
        I.waitForElement((locate('li').withText(textNumber21)).inside('ol').inside('li').inside('ol'));
        I.waitForElement((locate('li').inside('ol')).at(3).withText(textNumber1_1));
    });
});

Scenario('[C7394] Send mail with different text alignments', async function (I, users) {

    const selectAlignment = (action) => {
        I.click(locate('button').withChild(locate('span').withText('Formats')));
        I.waitForElement((locate('span').withText('Alignment')).inside('.mce-floatpanel'));
        I.click(locate('span.mce-text').withText('Alignment'));
        I.click(locate('span.mce-text').withText(action));
        I.waitForInvisible('.mce-floatpanel');
    };
    let [sender, recipient] = users;

    const mailSubject = 'C7394 Different text alignments';

    const defaultText = 'This text has no alignment.';
    const textLeftAligned = 'This text is left aligned';
    const textCentered = 'This text is centered';
    const textRightAligned = 'This text is right aligned';
    const textJustify = 'This text should be aligned justifyed';

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

    // Write some right aligned text
    selectAlignment('Right');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textRightAligned);
        I.pressKey('Enter');
    });

    // Write some left aligned text
    selectAlignment('Left');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textLeftAligned);
        I.pressKey('Enter');
    });

    // Write some centered text
    selectAlignment('Right');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textCentered);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });
    selectAlignment('Center');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
        I.pressKey('Enter');
    });

    // Write some justifyed text
    selectAlignment('Justify');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textJustify);
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
        I.waitForElement(locate('div').withText(defaultText));
        expect(await I.grabCssPropertyFrom(locate('div').withText(defaultText), 'text-align')).to.include('start');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textRightAligned), 'text-align')).to.include('right');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textLeftAligned), 'text-align')).to.include('left');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textCentered), 'text-align')).to.include('center');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textJustify), 'text-align')).to.include('justify');
    });
});

Scenario('[C7395] Send mail with text indentations', async function (I, users) {

    let [sender, recipient] = users;

    const mailSubject = 'C7395 Different text indentations';
    const defaultText = 'This text has the default text size.';
    const textIndent1 = 'Text with indention 1.';
    const textIndent2 = 'Text with indention level 2.';
    const textIndent3 = 'Text with indention 3.';
    const textIndent11 = 'Text with indention level one, again.';
    const textIndent0 = 'And some not indented text at the end';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail', { user: sender });

    // Open the mail composer
    I.retry(5).click('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');

    // Fill out to and subject
    I.waitForFocus('input[placeholder="To"]');
    I.fillField('To', recipient.get('primaryEmail'));
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.pressKey(defaultText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textIndent1);
    });

    I.click(locate('button').inside('~Increase indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Increase indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textIndent2);
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Increase indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textIndent3);
        I.pressKey('Enter');
    });

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textIndent11);
    });
    I.click(locate('button').inside('~Increase indent'));
    I.click(locate('button').inside('~Decrease indent'));
    I.click(locate('button').inside('~Decrease indent'));
    I.click(locate('button').inside('~Decrease indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey('Enter');
    });

    I.click(locate('button').inside('~Decrease indent'));

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textIndent0);
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
        expect(await I.grabCssPropertyFrom(locate('div').withText(defaultText), 'padding-left')).to.include('0px');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textIndent1), 'padding-left')).to.include('40px');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textIndent2), 'padding-left')).to.include('80px');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textIndent3), 'padding-left')).to.include('120px');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textIndent11), 'padding-left')).to.include('40px');
        expect(await I.grabCssPropertyFrom(locate('div').withText(textIndent0), 'padding-left')).to.include('0px');
    });
});

Scenario('[C7396] Send mail with different text fonts @shaky', async function (I, users) {

    const selectFont = (action) => {
        I.click(locate('button').inside('~Font Family'));
        I.waitForElement((locate('span').withText('Arial')).inside('.mce-floatpanel'));
        I.click(locate('span.mce-text').withText(action));
        I.waitForInvisible('.mce-floatpanel');
    };
    let [sender, recipient] = users;

    const mailSubject = 'C7396 Different text fonts';

    const defaultText = 'This text has no changed font.';
    const textArial = 'This is text written in Arial.';
    const textArialBlack = 'And this one with Arial Black!';
    const textComicSansMS = 'Ohh, ugly Comic Sans MS:';
    const textCourierNew = 'Yeah, Courier New 1337;';
    const textHelvetica = 'And now some text in Helvetica.';
    const textTerminal = 'And how does Terminal looks like?';
    const textVerdana = 'Verdana, oho, Verdana, ohohoho...';
    const textWebdings = 'This one looks ugly with Webdings!';

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

    // Write some text with H3
    selectFont('Arial');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textArial);
        I.pressKey('Enter');
    });

    // Write some text with H5
    selectFont('Arial Black');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textArialBlack);
        I.pressKey('Enter');
    });

    // Write some text with H6, but change it to H1
    selectFont('Georgia');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textComicSansMS);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });
    selectFont('Comic Sans MS');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
        I.pressKey('Enter');
    });

    selectFont('Courier New');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textCourierNew);
        I.pressKey('Enter');
    });

    // Write some text with H2
    selectFont('Helvetica');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textHelvetica);
        I.pressKey('Enter');
    });

    selectFont('Terminal');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textTerminal);
        I.pressKey('Enter');
    });

    selectFont('Verdana');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textVerdana);
        I.pressKey('Enter');
    });

    selectFont('Webdings');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textWebdings);
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
        const styleDefault = await I.grabAttributeFrom(locate('div').withText(defaultText), 'style');
        const styleArial = await I.grabCssPropertyFrom(locate('span').withText(textArial), 'font-family');
        const styleArialBlack = await I.grabCssPropertyFrom(locate('span').withText(textArialBlack), 'font-family');
        const styleComicSansMS = await I.grabCssPropertyFrom(locate('span').withText(textComicSansMS), 'font-family');
        const styleCourierNew = await I.grabCssPropertyFrom(locate('span').withText(textCourierNew), 'font-family');
        const styleHelvetica = await I.grabCssPropertyFrom(locate('span').withText(textHelvetica), 'font-family');
        const styleTerminal = await I.grabCssPropertyFrom(locate('span').withText(textTerminal), 'font-family');
        const styleVerdana = await I.grabCssPropertyFrom(locate('span').withText(textVerdana), 'font-family');
        const styleWebdings = await I.grabCssPropertyFrom(locate('span').withText(textWebdings), 'font-family');

        expect(styleDefault).to.have.lengthOf(0);
        expect(styleArial.join()).to.include('arial');
        expect(styleArialBlack.join()).to.include('arial black');
        expect(styleComicSansMS.join()).to.include('comic sans ms');
        expect(styleCourierNew.join()).to.include('courier new');
        expect(styleHelvetica.join()).to.include('helvetica');
        expect(styleTerminal.join()).to.include('terminal');
        expect(styleVerdana.join()).to.include('verdana');
        expect(styleWebdings.join()).to.include('webdings');
    });
});

// combined with [C7383] Compose HTML mail
Scenario('[C7397] Send mail with different text styles', async function (I, users) {

    const selectHeading = (action) => {
        I.click(locate('button').withChild(locate('span').withText('Formats')));
        I.waitForElement((locate('span').withText('Headings')).inside('.mce-floatpanel'));
        I.click(locate('span.mce-text').withText('Headings'));
        I.click(locate('span.mce-text').withText(action));
        I.waitForInvisible('.mce-floatpanel');
    };
    let [sender, recipient] = users;

    const mailSubject = 'C7397 Different text styles';

    const defaultText = 'This text has no style.';
    const textH3 = 'This is H3 text.';
    const textH5 = 'This is H5 text:';
    const textH1 = 'This is H1 text,';
    const textH2 = 'This is H2 text;';

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

    // Write some text with H3
    selectHeading('Heading 3');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textH3);
        I.pressKey('Enter');
    });

    // Write some text with H5
    selectHeading('Heading 5');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textH5);
        I.pressKey('Enter');
    });

    // Write some text with H6, but change it to H1
    selectHeading('Heading 6');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textH1);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });
    selectHeading('Heading 1');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
        I.pressKey('Enter');
    });

    // Write some text with H2
    selectHeading('Heading 2');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textH2);
        I.pressKey('Enter');
    });

    // Send the mail
    I.click('Send');

    // Let's stick around a bit for sending to finish
    I.waitForDetached('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);

    // move to to 'sent' folder (First of C7383)
    I.selectFolder('Sent');
    I.waitForText(mailSubject);
    I.click(mailSubject, '.list-item.selectable');

    // open mail source dialog
    I.click('~More actions', '.detail-view-header');
    I.waitForVisible('[data-action="io.ox/mail/actions/source"]', 'body > .dropdown');
    I.click('[data-action="io.ox/mail/actions/source"]', 'body > .dropdown');
    I.waitForVisible('body .mail-source-dialog');

    // check mail source of recently sent mail (Last of C7383)
    let [source] = await I.grabValueFrom('body .mail-source-view');
    expect(source).to.contain(`>${textH3}</h3>`);
    expect(source).to.contain(`>${textH5}</h5>`);
    expect(source).to.contain(`>${textH1}</h1>`);
    expect(source).to.contain(`>${textH2}</h2>`);
    I.pressKey('Escape');

    I.logout();

    // Log in as second user and navigate to mail app
    I.login('app=io.ox/mail', { user: recipient });

    // Open the mail
    I.waitForText(mailSubject, 2);
    I.retry(5).click(locate('.list-item').withText(mailSubject).inside('.list-view'));
    I.waitForVisible('iframe.mail-detail-frame');

    await within({ frame: '.mail-detail-frame' }, async () => {
        I.waitForElement(locate('div').withText(defaultText));
        I.waitForElement(locate('h3').withText(textH3));
        I.waitForElement(locate('h5').withText(textH5));
        I.waitForElement(locate('h1').withText(textH1));
        I.waitForElement(locate('h2').withText(textH2));
    });
});

Scenario('[C7398] Send mail with different text sizes', async function (I, users) {

    const selectFontSize = (action) => {
        I.click(locate('button').inside('~Font Sizes'));
        I.waitForElement((locate('span').withText('12pt')).inside('.mce-floatpanel'));
        I.click(locate('span.mce-text').withText(action));
        I.waitForInvisible('.mce-floatpanel');
    };
    let [sender, recipient] = users;

    const mailSubject = 'C7398 Different text sizes';
    const defaultText = 'This text has the default text size.';
    const text13pt = 'We switched to 13pt for this text!';
    const text16pt = 'Text in 16pt should also work, right?';
    const text36pt = 'And a little BIGGER with 36pt...';
    const text8pt = 'And last a small text with 8pt.';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail', { user: sender });

    // Open the mail composer
    I.retry(5).click('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');

    // Fill out to and subject
    I.waitForFocus('input[placeholder="To"]');
    I.fillField('To', recipient.get('primaryEmail'));
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.pressKey(defaultText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Write some text in 13pt
    selectFontSize('13pt');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(text13pt);
        I.pressKey('Enter');
    });

    // Write some text in 16pt
    selectFontSize('16pt');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(text16pt);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Write some text in 10pt, but change it to 36pt
    selectFontSize('10pt');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(text36pt);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });
    selectFontSize('36pt');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
        I.pressKey('Enter');
    });

    // Write some text in 8pt
    selectFontSize('8pt');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(text8pt);
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
        const styleDefault = await I.grabAttributeFrom(locate('div').withText(defaultText), 'style');
        const style13 = await I.grabAttributeFrom(locate('span').withText(text13pt), 'style');
        const style16 = await I.grabAttributeFrom(locate('span').withText(text16pt), 'style');
        const style36 = await I.grabAttributeFrom(locate('span').withText(text36pt), 'style');
        const style8 = await I.grabAttributeFrom(locate('span').withText(text8pt), 'style');

        expect(styleDefault).to.have.lengthOf(0);
        expect(style13.join()).to.include('13pt');
        expect(style16.join()).to.include('16pt');
        expect(style36.join()).to.include('36pt');
        expect(style8.join()).to.include('8pt');
    });
});

function getRGBValue(toConvert) {
    // converts rgba(255, 0, 0, 1) --> 255,0,0,1
    toConvert.forEach(function (element, index) {
        toConvert[index] = element.match(/\d+/g).map(function (a) { return parseInt(a, 10); }).join();
    });
    return toConvert;
}

Scenario('[C7399] Send mail with different text colours', async function (I, users) {

    const selectColor = (action) => {
        I.click(locate('.mce-open').inside('~Text color'));
        I.waitForElement('.mce-floatpanel .mce-colorbutton-grid');
        I.click('div[title="' + action + '"]');
        I.waitForInvisible('.mce-floatpanel .mce-colorbutton-grid');
    };
    let [sender, recipient] = users;

    const mailSubject = 'C7399 Different text colors';
    const defaultText = 'This text has no color.';
    const redText = 'This is a text in red.';
    const aquaText = 'This text should be display with aqua.';
    const limeText = 'And now a lime text!';
    const blackText = 'This text is black...';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail', { user: sender });

    // Open the mail composer
    I.retry(5).click('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');

    // Fill out to and subject
    I.waitForFocus('input[placeholder="To"]');
    I.fillField('To', recipient.get('primaryEmail'));
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.pressKey(defaultText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Write some text in red
    selectColor('Red');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(redText);
        I.pressKey('Enter');
    });

    // Write some text in aqua
    selectColor('Aqua');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(aquaText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Write some text in yellow, but change it to lime
    selectColor('Yellow');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(limeText);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });
    selectColor('Lime');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
        I.pressKey('Enter');
    });

    // Write some text in black
    selectColor('Black');
    await within({ frame: iframeLocator }, async () => {
        I.pressKey(blackText);
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
        const rgbBlack = '0,0,0,1';
        const rgbRed = '255,0,0,1';
        const rgbAqua = '0,255,255,1';
        const rgbLime = '0,255,0,1';

        const valueDefault = getRGBValue(await I.grabCssPropertyFrom(locate('div').withText(defaultText), 'color'));
        const valueRed = getRGBValue(await I.grabCssPropertyFrom(locate('span').withText(redText), 'color'));
        const valueAqua = getRGBValue(await I.grabCssPropertyFrom(locate('span').withText(aquaText), 'color'));
        const valueLime = getRGBValue(await I.grabCssPropertyFrom(locate('span').withText(limeText), 'color'));
        const valueBlack = getRGBValue(await I.grabCssPropertyFrom(locate('span').withText(blackText), 'color'));

        expect(valueDefault).to.include(rgbBlack);
        expect(valueRed).to.include(rgbRed);
        expect(valueAqua).to.include(rgbAqua);
        expect(valueLime).to.include(rgbLime);
        expect(valueBlack).to.include(rgbBlack);
    });
});

const selectHeading = (I, heading) => {
    I.click(locate('button').withChild(locate('span').withText('Formats')));
    I.waitForElement((locate('span').withText('Headings')).inside('.mce-floatpanel'));
    I.click(locate('span.mce-text').withText('Headings'));
    I.click(locate('span.mce-text').withText(heading));
    I.waitForInvisible('.mce-floatpanel');
};

const selectInline = (I, inline) => {
    I.click(locate('button').withChild(locate('span').withText('Formats')));
    I.waitForElement((locate('span').withText('Inline')).inside('.mce-floatpanel'));
    I.click(locate('span.mce-text').withText('Inline'));
    I.click(locate('span.mce-text').withText(inline));
    I.waitForInvisible('.mce-floatpanel');
};

const selectFont = (I, font) => {
    I.click(locate('button').inside('~Font Family'));
    I.waitForElement((locate('span').withText('Arial')).inside('.mce-floatpanel'));
    I.click(locate('span.mce-text').withText(font));
    I.waitForInvisible('.mce-floatpanel');
};

const selectColor = (I, color) => {
    I.click(locate('.mce-open').inside('~Text color'));
    I.waitForElement('.mce-floatpanel .mce-colorbutton-grid');
    I.click('div[title="' + color + '"]');
    I.waitForInvisible('.mce-floatpanel .mce-colorbutton-grid');
};

const selectBackgroundColor = (I, color) => {
    I.click(locate('.mce-open').inside('~Background color'));
    I.waitForElement('.mce-floatpanel .mce-colorbutton-grid');
    I.click(locate('div[title="' + color + '"]').inside('.//div[contains(@class, "mce-floatpanel") and not(contains(@style, "none"))]'));
    I.waitForInvisible('.mce-floatpanel .mce-colorbutton-grid');
};

const selectAlignment = (I, align) => {
    I.click(locate('button').withChild(locate('span').withText('Formats')));
    I.waitForElement((locate('span').withText('Alignment')).inside('.mce-floatpanel'));
    I.click(locate('span.mce-text').withText('Alignment'));
    I.click(locate('span.mce-text').withText(align));
    I.waitForInvisible('.mce-floatpanel');
};

const selectFontSize = (I, fontSize) => {
    I.click(locate('button').inside('~Font Sizes'));
    I.waitForElement((locate('span').withText('12pt')).inside('.mce-floatpanel'));
    I.click(locate('span.mce-text').withText(fontSize));
    I.waitForInvisible('.mce-floatpanel');
};
Scenario('[C7400] Send mail with multiple different text formatting - set before writting @shaky', async function (I, users) {

    let [sender, recipient] = users;

    const mailSubject = 'C7400 Different text formatting - set before writting';
    const defaultText = 'This text has no color.';
    const textFormatted = 'This text is formatted!';

    const iframeLocator = '.io-ox-mail-compose-window .editor iframe';

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
        I.pressKey('Enter');
    });

    selectHeading(I, 'Heading 1');
    selectInline(I, 'Strikethrough');
    selectFont(I, 'Courier New');
    selectColor(I, 'Red');
    selectBackgroundColor(I, 'Yellow');
    selectAlignment(I, 'Center');
    selectFontSize(I, '10pt');

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textFormatted);
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

        const span = locate('span').withText(textFormatted).inside('h1');

        //const rgbBlack = '0,0,0,1';
        const rgbRed = '255,0,0,1';
        const rgbYellow = '255,255,0,1';

        expect((await I.grabCssPropertyFrom(span, 'text-decoration')).join()).to.include('line-through');
        expect((await I.grabCssPropertyFrom(span, 'font-family')).join()).to.include('courier new');
        expect(getRGBValue(await I.grabCssPropertyFrom(span, 'color'))).to.include(rgbRed);
        expect(getRGBValue(await I.grabCssPropertyFrom(span, 'background-color'))).to.include(rgbYellow);
        expect(await I.grabCssPropertyFrom(span, 'text-align')).to.include('center');
        expect((await I.grabAttributeFrom(span, 'style')).join()).to.include('10pt');
    });
});

Scenario('[C7400] Send mail with multiple different text formatting - set after writting', async function (I, users) {

    let [sender, recipient] = users;

    const mailSubject = 'C7400 Different text formatting - set after writting';
    const defaultText = 'This text has no color.';
    const textFormatted = 'This text is formatted!';

    const iframeLocator = '.io-ox-mail-compose-window .editor iframe';

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
        I.pressKey('Enter');
    });

    await within({ frame: iframeLocator }, async () => {
        I.pressKey(textFormatted);
        I.pressKey(['Shift', 'Home']); // Select the just written text
    });

    selectHeading(I, 'Heading 1');
    selectInline(I, 'Strikethrough');
    selectFont(I, 'Courier New');
    selectColor(I, 'Red');
    selectBackgroundColor(I, 'Yellow');
    selectAlignment(I, 'Center');
    selectFontSize(I, '10pt');

    await within({ frame: iframeLocator }, async () => {
        I.pressKey('End');
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

        const span = locate('span').withText(textFormatted).inside('h1');

        //const rgbBlack = '0,0,0,1';
        const rgbRed = '255,0,0,1';
        const rgbYellow = '255,255,0,1';

        expect((await I.grabCssPropertyFrom(span, 'text-decoration')).join()).to.include('line-through');
        expect((await I.grabCssPropertyFrom(span, 'font-family')).join()).to.include('courier new');
        expect(getRGBValue(await I.grabCssPropertyFrom(span, 'color'))).to.include(rgbRed);
        expect(getRGBValue(await I.grabCssPropertyFrom(span, 'background-color'))).to.include(rgbYellow);
        expect(await I.grabCssPropertyFrom(span, 'text-align')).to.include('center');
        expect((await I.grabAttributeFrom(span, 'style')).join()).to.include('10pt');
    });
});
