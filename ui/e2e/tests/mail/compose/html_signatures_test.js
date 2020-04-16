/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail Compose > HTML signatures');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
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
    I.click(mail.locators.compose.signatures);
    I.click(name);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
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

Scenario('Compose new mail with signature above correctly placed and changed', async function (I, mail) {
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
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
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
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
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
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('Compose new mail with signature below correctly placed initially', async function (I, mail) {
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

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>`)
        );
    });

    //discard mail
    I.click(mail.locators.compose.close);
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('Reply to mail with signature above correctly placed and changed', async function (I, users, mail) {
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
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);

    I.say('📢 blockquote only', 'blue');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
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
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        // insert some text
        I.appendField('body', 'some user input');
        expect(await I.grabHTMLFrom('body')).to.match(
            /^<div>some user input<\/div><div class="io-ox-signature">.*<\/div><blockquote type="cite">.*<\/blockquote>$/
        );
    });
    await selectAndAssertSignature(I, mail, 'Second signature above', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[1].content}</div><blockquote type="cite">.*</blockquote>$`));
    await selectAndAssertSignature(I, mail, 'First signature below', new RegExp('^' + someUserInput + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>$`));
    await selectAndAssertSignature(I, mail, 'Second signature below', new RegExp('^' + someUserInput + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[3].content}</div>$`));
    await selectAndAssertSignature(I, mail, 'No signature', new RegExp('^' + someUserInput + '<blockquote type="cite">.*</blockquote>' + emptyLine + '$'));
    await selectAndAssertSignature(I, mail, 'First signature above', new RegExp('^' + someUserInput + `<div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote>$`));

    // discard mail
    I.click(mail.locators.compose.close);
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');
});

Scenario('Reply to mail with signature below correctly placed initially', async function (I, users, mail) {
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
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp('^' + emptyLine + '<blockquote type="cite">.*</blockquote>' + emptyLine + `<div class="io-ox-signature">${signatures[2].content}</div>$`)
        );
    });

    // discard mail
    I.click(mail.locators.compose.close);
    I.waitForVisible('.io-ox-mail-window');
});
