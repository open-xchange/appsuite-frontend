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

Feature('Mail compose: HTML signatures');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
    signatures.forEach(signature => delete signature.id);
});

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

async function selectAndAssertSignature(I, name, compare) {
    I.click('Signatures');
    I.click(name);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        let result = await I.grabHTMLFrom('body > *');
        result = [].concat(result).join('');
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

Scenario('compose new mail with signature above correctly placed and changed', async function (I) {
    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultSignature', signatures[0].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body > *')).to.deep.equal([
            '<div><br></div>',
            `<div class="io-ox-signature">${signatures[0].content}</div>`
        ]);
    });

    await selectAndAssertSignature(I, 'Second signature above', `<div><br></div><div class="io-ox-signature">${signatures[1].content}</div>`);
    await selectAndAssertSignature(I, 'First signature below', `<div><br></div><div class="io-ox-signature">${signatures[2].content}</div>`);
    await selectAndAssertSignature(I, 'Second signature below', `<div><br></div><div class="io-ox-signature">${signatures[3].content}</div>`);
    await selectAndAssertSignature(I, 'No signature', '<div><br></div>');
    await selectAndAssertSignature(I, 'First signature above', `<div><br></div><div class="io-ox-signature">${signatures[0].content}</div>`);

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        // insert some text
        I.appendField('body', 'some user input');
        expect(await I.grabHTMLFrom('body > *')).to.deep.equal([
            '<div>some user input</div>',
            `<div class="io-ox-signature">${signatures[0].content}</div>`
        ]);
    });

    await selectAndAssertSignature(I, 'Second signature above', `<div>some user input</div><div class="io-ox-signature">${signatures[1].content}</div>`);
    await selectAndAssertSignature(I, 'First signature below', `<div>some user input</div><div class="io-ox-signature">${signatures[2].content}</div>`);
    await selectAndAssertSignature(I, 'Second signature below', `<div>some user input</div><div class="io-ox-signature">${signatures[3].content}</div>`);
    await selectAndAssertSignature(I, 'No signature', '<div>some user input</div>');
    await selectAndAssertSignature(I, 'First signature above', `<div>some user input</div><div class="io-ox-signature">${signatures[0].content}</div>`);

    // // discard mail
    I.click('Discard');
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');

    // client.logout();
    I.logout();
});

Scenario('compose new mail with signature below correctly placed initially', async function (I) {
    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultSignature', signatures[2].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect(await I.grabHTMLFrom('body > *')).to.deep.equal([
            '<div><br></div>',
            `<div class="io-ox-signature">${signatures[2].content}</div>`
        ]);
    });

    //     // discard mail
    I.click('Discard');
    I.waitForVisible('.io-ox-mail-window');

    I.logout();
});

Scenario('Reply to mail with signature above correctly placed and changed', async function (I, users) {
    let [user] = users;
    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultReplyForwardSignature', signatures[0].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');
    await I.haveMail(getTestMail(user));

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(await I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');

    // reply to that mail
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect((await I.grabHTMLFrom('body > *')).join('')).to.match(
            new RegExp(`^<div><br></div><div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$`)
        );
    });
    await selectAndAssertSignature(I, 'Second signature above', new RegExp(`^<div><br></div><div class="io-ox-signature">${signatures[1].content}</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$`));
    await selectAndAssertSignature(I, 'First signature below', new RegExp(`^<div><br></div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div><div class="io-ox-signature">${signatures[2].content}</div>$`));
    await selectAndAssertSignature(I, 'Second signature below', new RegExp(`^<div><br></div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div><div class="io-ox-signature">${signatures[3].content}</div>$`));
    await selectAndAssertSignature(I, 'No signature', new RegExp('^<div><br></div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$'));
    await selectAndAssertSignature(I, 'First signature above', new RegExp(`^<div><br></div><div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$`));

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        // insert some text
        I.appendField('body', 'some user input');
        expect((await I.grabHTMLFrom('body > *')).join('')).to.match(
            /^<div>some user input<\/div><div class="io-ox-signature">.*<\/div><blockquote type="cite">.*<\/blockquote><div class="default-style"><br>&nbsp;<\/div>$/
        );
    });

    await selectAndAssertSignature(I, 'Second signature above', new RegExp(`^<div>some user input</div><div class="io-ox-signature">${signatures[1].content}</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$`));
    await selectAndAssertSignature(I, 'First signature below', new RegExp(`^<div>some user input</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div><div class="io-ox-signature">${signatures[2].content}</div>$`));
    await selectAndAssertSignature(I, 'Second signature below', new RegExp(`^<div>some user input</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div><div class="io-ox-signature">${signatures[3].content}</div>$`));
    await selectAndAssertSignature(I, 'No signature', new RegExp('^<div>some user input</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$'));
    await selectAndAssertSignature(I, 'First signature above', new RegExp(`^<div>some user input</div><div class="io-ox-signature">${signatures[0].content}</div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div>$`));

    // discard mail
    I.click('Discard');
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');

    I.logout();
});

Scenario('Reply to mail with signature below correctly placed initially', async function (I, users) {
    let [user] = users;
    for (let signature of signatures) {
        var response = await I.haveSnippet(signature);
        signature.id = response.data;
    }
    await I.haveSetting('io.ox/mail//defaultReplyForwardSignature', signatures[2].id);
    await I.haveSetting('io.ox/mail//messageFormat', 'html');
    await I.haveMail(getTestMail(user));

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');

    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(await I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');

    //     // reply to that mail
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    I.wait(1);
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        expect((await I.grabHTMLFrom('body > *')).join('')).to.match(
            new RegExp(`^<div><br></div><blockquote type="cite">.*</blockquote><div class="default-style"><br>&nbsp;</div><div class="io-ox-signature">${signatures[2].content}</div>$`)
        );
    });

    //     // discard mail
    I.click('Discard');
    I.waitForVisible('.io-ox-mail-window');

    I.logout();
});

