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

Feature('Mail Compose > HTML signatures');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
    signatures.forEach(signature => delete signature.id);
});

// differrent variants in tinymce
var emptyLine = '(' +
        '<div><br></div>' + '|' +
        '<div><br>&nbsp;</div>' + '|' +
        '<div class="default-style"><br></div>' + '|' +
        '<div class="default-style"><br>&nbsp;</div>' +
    ')',
    someUserInput = '(' +
        '<div>some user input</div>' + '|' +
        '<div class="default-style">some user input</div>' + '|' +
    ')';

const signatures = [{
    content: '<p>The content of the first signature</p>',
    displayname: 'First signature above',
    misc: { insertion: 'above', 'content-type': 'text/html' },
    module: 'io.ox/mail',
    type: 'signature'
}, {
    content: '<p>The content of the second signature</p>',
    displayname: 'Second signature above',
    misc: { insertion: 'above', 'content-type': 'text/html' },
    module: 'io.ox/mail',
    type: 'signature'
}, {
    content: '<p>The content of the third signature</p>',
    displayname: 'First signature below',
    misc: { insertion: 'below', 'content-type': 'text/html' },
    module: 'io.ox/mail',
    type: 'signature'
}, {
    content: '<p>The content of the fourth signature</p>',
    displayname: 'Second signature below',
    misc: { insertion: 'below', 'content-type': 'text/html' },
    module: 'io.ox/mail',
    type: 'signature'
}];

async function selectAndAssertSignature(I, mail, name, compare) {
    I.click(mail.locators.compose.options);
    I.click(name);
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        let result = await I.grabHTMLFrom('body');
        if (compare instanceof RegExp) expect(result).to.match(compare);
        else expect(result).to.equal(compare);
    });
}

function getTestMail(user) {
    return {
        attachments: [{
            content: '<div>Test content</div>',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    };
}

Scenario('Compose new mail with signature above correctly placed and changed', async ({ I, mail }) => {
    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultSignature', signatures[0].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');
    await I.haveSetting('io.ox/mail//compose/signatureLimit', 5);

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);

    I.say('📢 blockquote only', 'blue');
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[0].content}</div>`)
        );
    });
    await selectAndAssertSignature(I, mail, 'Second signature above', new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[1].content}</div>`));
    await selectAndAssertSignature(I, mail, 'First signature below', new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>`));
    await selectAndAssertSignature(I, mail, 'Second signature below', new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[3].content}</div>`));
    await selectAndAssertSignature(I, mail, 'No signature', new RegExp('^' + emptyLine));
    await selectAndAssertSignature(I, mail, 'First signature above', new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[0].content}</div>`));

    I.say('📢 blockquote and user input', 'blue');
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        // insert some text
        I.appendField('body', 'some user input');
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[0].content}</div>`)
        );
    });
    await selectAndAssertSignature(I, mail, 'Second signature above', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[1].content}</div>`));
    await selectAndAssertSignature(I, mail, 'First signature below', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[2].content}</div>`));
    await selectAndAssertSignature(I, mail, 'Second signature below', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[3].content}</div>`));
    await selectAndAssertSignature(I, mail, 'No signature', new RegExp('^' + someUserInput));
    await selectAndAssertSignature(I, mail, 'First signature above', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[0].content}</div>`));

    // // discard mail
    I.click(mail.locators.compose.close);
    I.click('Delete draft');
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('Compose new mail with signature below correctly placed initially', async ({ I, mail }) => {
    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultSignature', signatures[2].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');
    await I.haveSetting('io.ox/mail//compose/signatureLimit', 5);

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);

    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>`)
        );
    });

    //discard mail
    I.click(mail.locators.compose.close);
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('Reply to mail with signature above correctly placed and changed', async ({ I, users, mail }) => {
    let [user] = users;

    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultReplyForwardSignature', signatures[0].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');
    await I.haveSetting('io.ox/mail//compose/signatureLimit', 5);
    await I.haveMail(getTestMail(user));

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    I.say('📢 click on first email', 'blue');
    I.retry(5).click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(await I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');

    I.say('📢 reply to that mail', 'blue');
    I.clickToolbar('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);

    I.say('📢 blockquote only', 'blue');
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote>$`)
        );
    });
    await selectAndAssertSignature(I, mail, 'Second signature above', new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[1].content}</div><blockquote type="cite">.*</blockquote>$`));
    await selectAndAssertSignature(I, mail, 'First signature below', new RegExp('^' + emptyLine + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>$`));
    await selectAndAssertSignature(I, mail, 'Second signature below', new RegExp('^' + emptyLine + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[3].content}</div>$`));
    await selectAndAssertSignature(I, mail, 'No signature', new RegExp('^' + emptyLine + '<blockquote type="cite">.*</blockquote>' + emptyLine + '$'));
    await selectAndAssertSignature(I, mail, 'First signature above', new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote>$`));

    I.say('📢 blockquote and user input', 'blue');
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        // insert some text
        I.appendField('body', 'some user input');
        expect(await I.grabHTMLFrom('body')).to.match(
            /^<div( class="default-style")?>some user input<\/div><div class="io-ox-signature">.*<\/div><blockquote type="cite">.*<\/blockquote>$/
        );
    });
    await selectAndAssertSignature(I, mail, 'Second signature above', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[1].content}</div><blockquote type="cite">.*</blockquote>$`));
    await selectAndAssertSignature(I, mail, 'First signature below', new RegExp('^' + someUserInput + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>$`));
    await selectAndAssertSignature(I, mail, 'Second signature below', new RegExp('^' + someUserInput + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[3].content}</div>$`));
    await selectAndAssertSignature(I, mail, 'No signature', new RegExp('^' + someUserInput + '<blockquote type="cite">.*</blockquote>' + emptyLine + '$'));
    await selectAndAssertSignature(I, mail, 'First signature above', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote>$`));

    // discard mail
    I.click(mail.locators.compose.close);
    I.click('Delete draft');
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('Reply to mail with signature below correctly placed initially', async ({ I, users, mail }) => {
    let [user] = users;

    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultReplyForwardSignature', signatures[2].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');
    await I.haveSetting('io.ox/mail//compose/signatureLimit', 5);
    await I.haveMail(getTestMail(user));

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    // click on first email
    I.retry(5).click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(await I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');

    // reply to that mail
    I.retry(5).clickToolbar('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + emptyLine + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>$`)
        );
    });

    // discard mail
    I.click(mail.locators.compose.close);
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('[C8825] Add and replace signatures', async ({ I, mail }) => {
    const first = 'Very original? A clever signature?',
        second = 'Super original and fabulous signature';

    await Promise.all([
        I.haveSetting({ 'io.ox/mail': { messageFormat: 'html' } }),
        I.haveSnippet({
            content: `<p>${first}</p>`,
            displayname: 'My signature',
            misc: { insertion: 'above', 'content-type': 'text/html' },
            module: 'io.ox/mail',
            type: 'signature'
        }),
        I.haveSnippet({
            content: `<p>${second}</p>`,
            displayname: 'Super signature',
            misc: { insertion: 'above', 'content-type': 'text/html' },
            module: 'io.ox/mail',
            type: 'signature'
        })
    ]);

    I.login('app=io.ox/mail');
    mail.newMail();

    I.click(mail.locators.compose.options);
    I.clickDropdown('My signature');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText(first);
    });

    I.click(mail.locators.compose.options);
    I.clickDropdown('Super signature');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText(second);
        I.dontSee(first);
    });
});

Scenario('[C265555] Change the Signature', async ({ I, mail, dialogs }) => {
    const firstSignatureContent = 'Very original? A clever signature?',
        secondSignatureContent = 'Super original and fabulous signature',
        [firstSignature] = await Promise.all([
            I.haveSnippet({
                content: '<p>' + firstSignatureContent + '</p>',
                displayname: 'My signature',
                misc: { insertion: 'above', 'content-type': 'text/html' },
                module: 'io.ox/mail',
                type: 'signature'
            }),
            I.haveSnippet({
                content: '<p>' + secondSignatureContent + '</p>',
                displayname: 'Super signature',
                misc: { insertion: 'above', 'content-type': 'text/html' },
                module: 'io.ox/mail',
                type: 'signature'
            }),
            I.haveSetting({ 'io.ox/mail': { messageFormat: 'html' } })
        ]);

    await I.haveSetting({ 'io.ox/mail': { defaultSignature: firstSignature.data } });

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText(firstSignatureContent);
    });
    I.fillField('To', 'foo@bar');
    I.fillField('Subject', 'test subject');

    I.click(mail.locators.compose.close);
    dialogs.waitForVisible();
    dialogs.clickButton('Save draft');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-mail-compose');

    I.selectFolder('Drafts');
    mail.selectMail('test subject');

    I.clickToolbar('.io-ox-mail-window .classic-toolbar [data-action="more"]');
    I.clickDropdown('Move');

    dialogs.waitForVisible();
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');

    I.dontSee('test subject');
    I.selectFolder('Inbox');
    I.waitForText('test subject', 5, '.list-view li[data-index="0"]');
    I.click('.list-view li[data-index="0"]');
    I.clickToolbar('~Reply to sender');
    I.waitForVisible('.io-ox-mail-compose-window #mce_1_ifr');
    within({ frame: '#mce_1_ifr' }, () => {
        I.waitForVisible(locate('blockquote').withText(firstSignatureContent));
        I.waitForVisible(locate('div.io-ox-signature').withText(firstSignatureContent));
    });
    // some focus event still needs to happen
    I.wait(0.5);
    I.click(mail.locators.compose.options);
    I.clickDropdown('Super signature');
    within({ frame: '#mce_1_ifr' }, () => {
        I.waitForVisible(locate('div.io-ox-signature').withText(secondSignatureContent));
        I.waitForVisible(locate('blockquote').withText(firstSignatureContent));
    });
});

Scenario('Use image-only signature', async ({ I, mail }) => {
    await Promise.all([
        I.haveSetting({ 'io.ox/mail': { messageFormat: 'html' } }),
        await I.haveSnippet({
            content: `<p><img src="${getBas64Image()}"></p>`,
            displayname: 'My image signature',
            misc: { insertion: 'above', 'content-type': 'text/html' },
            module: 'io.ox/mail',
            type: 'signature'
        })
    ]);

    I.login('app=io.ox/mail');
    mail.newMail();
    I.click(mail.locators.compose.options);
    I.waitForText('My image signature');
    I.click('My image signature');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForElement('img');
    });
});

function getBas64Image() {
    return 'data:image/png;base64,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';
}

Scenario('[OXUIB-370] Default font style is used after appending signature', async ({ I, mail }) => {
    // we append linebreaks, when adding a signature into an empy compose window
    // need to check if default font style is acknowledged above the added signature
    await Promise.all([
        I.haveSnippet(signatures[2]),
        I.haveSetting('io.ox/mail//defaultFontStyle', { color: '#0000FF', family: 'arial black,avant garde', size: '10pt' })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();

    await selectAndAssertSignature(I, mail, 'First signature below',
        new RegExp('^<div style="font-size: 10pt; font-family: arial black,avant garde; color: #0000ff;" class="default-style"(.*)><br(.*)></div>' +
        `<div class="io-ox-signature">${signatures[2].content}</div>`));
});

Scenario('[OXUIB-370] Default font style is used when appending signature below quoted text', async ({ I, users, mail }) => {
    //another case where we append line breaks
    const [user] = users;

    await Promise.all([
        I.haveSnippet(signatures[2]),
        I.haveSetting('io.ox/mail//defaultFontStyle', { color: '#0000FF', family: 'arial black,avant garde', size: '10pt' }),
        I.haveMail({
            attachments: [{
                content: 'Test signatures and default font style',
                content_type: 'text/html',
                disp: 'inline'
            }],
            from: [[user.get('display_name'), user.get('primaryEmail')]],
            sendtype: 0,
            subject: 'OXUIB-370',
            to: [[user.get('display_name'), user.get('primaryEmail')]]
        }, { user })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail('OXUIB-370');
    I.waitForText('Reply', 10, '.rightside.mail-detail-pane');
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose iframe');
    I.waitForDetached('.io-ox-mail-compose .io-ox-busy');
    I.waitForVisible({ css: 'li[data-extension-id="composetoolbar-menu"]' });
    I.waitForClickable({ css: 'li[data-extension-id="composetoolbar-menu"] a' });

    await selectAndAssertSignature(I, mail, 'First signature below',
        new RegExp('^<div style="font-size: 10pt;(.*)' + '<blockquote type="cite">(.*)</blockquote>(.*)' +
        '<div class="default-style" style="font-size: 10pt; font-family: arial black,avant garde; color: #0000ff;" (.*)><br(.*)></div>' +
        `<div class="io-ox-signature">${signatures[2].content}</div>`
        ));
});
