/// <reference path="../../../steps.d.ts" />

Feature('Mail compose: HTML signatures');

var signatures = [
    'The content of the first signature',
    'The content of the second signature',
    'The content of the third signature',
    'The content of the fourth signature'
];

function* selectAndAssertSignature(I, name, compare) {
    I.click('Signatures');
    I.click(name);
    let result = yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *');
    result = [].concat(result).join('');
    if (compare instanceof RegExp) result.should.match(compare);
    else result.should.equal(compare);
}

Scenario('compose new mail with signature above correctly placed and changed', function* (I) {
    I.login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' });
    I.waitForVisible('.io-ox-mail-window');
    I.setSetting('io.ox/mail', 'defaultSignature', '0');
    I.setSetting('io.ox/mail', 'messageFormat', 'html');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor .editable');
    I.wait(1);
    expect(yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *')).to.deep.equal([
        '<p><br></p>',
        `<div class="io-ox-signature"><p>${signatures[0]}</p></div>`
    ]);

    yield* selectAndAssertSignature(I, 'Second signature above', `<p><br></p><div class="io-ox-signature"><p>${signatures[1]}</p></div>`);
    yield* selectAndAssertSignature(I, 'First signature below', `<p><br></p><div class="io-ox-signature"><p>${signatures[2]}</p></div>`);
    yield* selectAndAssertSignature(I, 'Second signature below', `<p><br></p><div class="io-ox-signature"><p>${signatures[3]}</p></div>`);
    yield* selectAndAssertSignature(I, 'No signature', '<p><br></p>');
    yield* selectAndAssertSignature(I, 'First signature above', `<p><br></p><div class="io-ox-signature"><p>${signatures[0]}</p></div>`);

    // insert some text
    I.appendField('.io-ox-mail-compose-window .editor .editable', 'some user input');
    expect(yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *')).to.deep.equal([
        '<p>some user input</p>',
        `<div class="io-ox-signature"><p>${signatures[0]}</p></div>`
    ]);

    yield* selectAndAssertSignature(I, 'Second signature above', `<p>some user input</p><div class="io-ox-signature"><p>${signatures[1]}</p></div>`);
    yield* selectAndAssertSignature(I, 'First signature below', `<p>some user input</p><div class="io-ox-signature"><p>${signatures[2]}</p></div>`);
    yield* selectAndAssertSignature(I, 'Second signature below', `<p>some user input</p><div class="io-ox-signature"><p>${signatures[3]}</p></div>`);
    yield* selectAndAssertSignature(I, 'No signature', '<p>some user input</p>');
    yield* selectAndAssertSignature(I, 'First signature above', `<p>some user input</p><div class="io-ox-signature"><p>${signatures[0]}</p></div>`);

    // // discard mail
    I.click('Discard');
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');

    // client.logout();
    I.logout();
});

Scenario('compose new mail with signature below correctly placed initially', function* (I) {
    I.login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' });
    I.waitForVisible('.io-ox-mail-window');
    I.setSetting('io.ox/mail', 'defaultSignature', '2');
    I.setSetting('io.ox/mail', 'messageFormat', 'html');

    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor .editable');
    I.wait(1);
    expect(yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *')).to.deep.equal([
        '<p><br></p>',
        `<div class="io-ox-signature"><p>${signatures[2]}</p></div>`
    ]);

    //     // discard mail
    I.click('Discard');
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');

    I.logout();
});

Scenario('Reply to mail with signature above correctly placed and changed', function* (I) {
    I.login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' });
    I.waitForVisible('.io-ox-mail-window');
    I.setSetting('io.ox/mail', 'defaultReplyForwardSignature', '0');
    I.setSetting('io.ox/mail', 'messageFormat', 'html');

    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(yield I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');

    // reply to that mail
    I.click('.io-ox-mail-window .window-content a[data-action="more"]');
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor .editable');
    I.wait(1);
    expect((yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *')).join('')).to.match(
        new RegExp(`^<p><br></p><div class="io-ox-signature"><p>${signatures[0]}</p></div><blockquote type="cite">.*</blockquote>$`)
    );

    yield* selectAndAssertSignature(I, 'Second signature above', new RegExp(`^<p><br></p><div class="io-ox-signature"><p>${signatures[1]}</p></div><blockquote type="cite">.*</blockquote>$`));
    yield* selectAndAssertSignature(I, 'First signature below', new RegExp(`^<p><br></p><blockquote type="cite">.*</blockquote><p><br></p><div class="io-ox-signature"><p>${signatures[2]}</p></div>$`));
    yield* selectAndAssertSignature(I, 'Second signature below', new RegExp(`^<p><br></p><blockquote type="cite">.*</blockquote><p><br></p><div class="io-ox-signature"><p>${signatures[3]}</p></div>$`));
    yield* selectAndAssertSignature(I, 'No signature', new RegExp('^<p><br></p><blockquote type="cite">.*</blockquote><p><br></p>$'));
    yield* selectAndAssertSignature(I, 'First signature above', new RegExp(`^<p><br></p><div class="io-ox-signature"><p>${signatures[0]}</p></div><blockquote type="cite">.*</blockquote>$`));

    // insert some text
    I.appendField('.io-ox-mail-compose-window .editor .editable', 'some user input');
    expect((yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *')).join('')).to.match(
        /^<p>some user input<\/p><div class="io-ox-signature">.*<\/div><blockquote type="cite">.*<\/blockquote>$/
    );

    yield* selectAndAssertSignature(I, 'Second signature above', new RegExp(`^<p>some user input</p><div class="io-ox-signature"><p>${signatures[1]}</p></div><blockquote type="cite">.*</blockquote>$`));
    yield* selectAndAssertSignature(I, 'First signature below', new RegExp(`^<p>some user input</p><blockquote type="cite">.*</blockquote><p><br></p><div class="io-ox-signature"><p>${signatures[2]}</p></div>$`));
    yield* selectAndAssertSignature(I, 'Second signature below', new RegExp(`^<p>some user input</p><blockquote type="cite">.*</blockquote><p><br></p><div class="io-ox-signature"><p>${signatures[3]}</p></div>$`));
    yield* selectAndAssertSignature(I, 'No signature', new RegExp('^<p>some user input</p><blockquote type="cite">.*</blockquote><p><br></p>$'));
    yield* selectAndAssertSignature(I, 'First signature above', new RegExp(`^<p>some user input</p><div class="io-ox-signature"><p>${signatures[0]}</p></div><blockquote type="cite">.*</blockquote>$`));

    // discard mail
    I.click('Discard');
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');

    I.logout();
});

Scenario('Reply to mail with signature below correctly placed initially', function* (I) {
    I.login('app=io.ox/mail', { prefix: 'io.ox/mail/signatures' });
    I.waitForVisible('.io-ox-mail-window');
    I.setSetting('io.ox/mail', 'defaultReplyForwardSignature', '2');
    I.setSetting('io.ox/mail', 'messageFormat', 'html');

    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    expect(yield I.grabTextFrom('.io-ox-mail-window .mail-detail-pane .subject')).to.equal('Test subject');

    //     // reply to that mail
    I.click('.io-ox-mail-window .window-content a[data-action="more"]');
    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor .editable');
    I.wait(1);
    expect((yield I.grabHTMLFrom('.io-ox-mail-compose-window .editor .editable > *')).join('')).to.match(
        new RegExp(`^<p><br></p><blockquote type="cite">.*</blockquote><p><br></p><div class="io-ox-signature"><p>${signatures[2]}</p></div>$`)
    );

    //     // discard mail
    I.click('Discard');
    I.click('Discard message');
    I.waitForVisible('.io-ox-mail-window');

    I.logout();
});
