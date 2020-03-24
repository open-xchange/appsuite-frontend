/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */


/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

// differrent variants in tinymce
const emptyLine = '(' +
    '<div><br></div>' + '|' +
    '<div><br>&nbsp;</div>' + '|' +
    '<div class="default-style"><br></div>' + '|' +
    '<div class="default-style"><br>&nbsp;</div>' +
')';

Feature('Settings > Mail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('Sanitize entered signature source code', async function (I) {

    var dialog = locate('.mce-window');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);

    I.waitForText('Add new signature');
    I.click('Add new signature');

    I.waitForVisible('.contenteditable-editor iframe');
    I.fillField('Signature name', 'Sanitize me!');

    await set('A<svg><svg onload="document.body.innerHTML=\'I am a hacker\'>Z', 'AZ');

    async function set(text, clean) {
        I.say('Add: source code');
        I.click('~Source code', '.mce-top-part');
        I.waitForElement(dialog);
        within(dialog, () => {
            I.appendField('textarea', text);
            I.click('Ok');
        });

        I.say('Check: body.innerHTML unchanged');
        I.wait(1);
        I.dontSee('I am a hacker');

        I.say('Check: value');
        I.waitForDetached(dialog);
        I.click('~Source code', '.mce-top-part');
        I.waitForElement(dialog);
        within(dialog, () => {
            I.seeInField('textarea', clean);
        });
    }
});

Scenario('[C7766] Create new signature', function (I, mail, dialogs) {

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);

    I.waitForText('Add new signature');
    I.click('Add new signature');
    dialogs.waitForVisible();

    I.waitForVisible('.contenteditable-editor iframe');
    I.fillField('Signature name', 'Testsignaturename');

    within({ frame: '.contenteditable-editor iframe' }, () => {
        I.appendField('body', 'Testsignaturecontent');
    });

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    // assert existance of signature
    I.waitForText('Testsignaturename');
    I.see('Testsignaturecontent');

    // disable default siganture
    I.selectOption('Default signature for new messages', 'No signature');
    I.selectOption('Default signature for replies or forwards', 'No signature');

    I.openApp('Mail');
    mail.waitForApp();

    mail.newMail();

    I.click(mail.locators.compose.options);
    I.clickDropdown('Testsignaturename');

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.see('Testsignaturecontent');
    });

});

Scenario('[C7767] Define signature position', async function (I, users, mail, dialogs) {
    const [user] = users;
    await I.haveMail({
        attachments: [{
            content: '<div>Test content</div>',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });
    await I.haveSnippet({
        content: '<p>Testsignaturecontent</p>',
        displayname: 'Testsignaturename',
        misc: { insertion: 'below', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);
    I.waitForText('Testsignaturename');
    I.see('Testsignaturecontent');

    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    I.selectOption('#signature-position', 'Add signature above quoted text');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    let option = await I.grabValueFrom('.modal-dialog select');
    I.see('Add signature above quoted text');
    expect(option).to.equal('above');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    // disable default siganture
    I.selectOption('Default signature for new messages', 'No signature');
    I.selectOption('Default signature for replies or forwards', 'No signature');

    I.openApp('Mail');
    mail.waitForApp();

    // reply to mail
    mail.selectMail('Test subject');
    I.click('Reply');

    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.waitForText('Test content');
    });
    I.wait(0.5); // there still might be a focus event somewhere

    I.click(mail.locators.compose.options);
    I.clickDropdown('Testsignaturename');

    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.seeElement(locate('.io-ox-signature').before({ css: 'blockquote[type="cite"]' }).as('Signature before quoted text'));
    });
});

Scenario('[C7768] Edit signature', async function (I, mail, dialogs) {
    await I.haveSnippet({
        content: '<p>Testsignaturecontent</p>',
        displayname: 'Testsignaturename',
        misc: { insertion: 'below', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);
    I.waitForText('Testsignaturename');
    I.see('Testsignaturecontent');

    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    I.fillField('Signature name', 'Newsignaturename');
    within({ frame: '.contenteditable-editor iframe' }, () => {
        I.fillField('body', 'Newsignaturecontent');
    });

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    // assert existance of signature
    I.waitForText('Newsignaturename');

    // disable default siganture
    I.selectOption('Default signature for new messages', 'No signature');
    I.selectOption('Default signature for replies or forwards', 'No signature');

    I.openApp('Mail');
    mail.waitForApp();

    mail.newMail();

    I.click(mail.locators.compose.options);
    I.clickDropdown('Newsignaturename');

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.see('Newsignaturecontent');
    });

});

Scenario('[C7769] Delete signature', async function (I) {
    await I.haveSnippet({
        content: '<p>Testsignaturecontent</p>',
        displayname: 'Testsignaturename',
        misc: { insertion: 'below', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);
    I.waitForText('Testsignaturename');
    I.see('Testsignaturecontent');

    I.click('a[title="Delete"]');
    I.waitForDetached('.settings-list-item');

    I.dontSee('Testsignaturename');
    I.dontSee('Testsignaturecontent');

});

Scenario('[C7770] Set default signature', async function (I, users) {
    const [user] = users;
    await I.haveMail({
        attachments: [{
            content: '<div>Test content</div>',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });
    const snippets = [];
    for (let i = 0; i < 3; i++) {
        snippets.push(await I.haveSnippet({
            content: `<p>Testsignaturecontent${i}</p>`,
            displayname: `Testsignaturename${i}`,
            misc: { insertion: 'above', 'content-type': 'text/html' },
            module: 'io.ox/mail',
            type: 'signature'
        }));
    }

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);
    I.waitForText('Testsignaturename0');
    I.see('Testsignaturecontent0');
    I.see('Testsignaturename1');
    I.see('Testsignaturecontent1');
    I.see('Testsignaturename2');
    I.see('Testsignaturecontent2');

    // select default signature
    I.selectOption('Default signature for new messages', 'Testsignaturename1');
    I.selectOption('Default signature for replies or forwards', 'Testsignaturename2');

    I.see('Default signature for new messages', `.settings-list-item[data-id="${snippets[1].data}"`);
    I.see('Default signature for replies or forwardings', `.settings-list-item[data-id="${snippets[2].data}"`);

    I.openApp('Mail');

    // compose a mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.waitForVisible('body');
        I.wait(0.5);
        I.see('Testsignaturecontent1');
    });
    I.click('~Close', '.floating-header');

    I.waitForDetached('.io-ox-mail-compose-window');

    // reply to mail
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');

    I.click('Reply');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.waitForVisible('body');
        I.wait(0.5);
        expect(await I.grabHTMLFrom('body')).to.match(
            new RegExp(`^${emptyLine}<div class="io-ox-signature"><p>Testsignaturecontent2</p></div><blockquote type="cite">.*</blockquote>$`)
        );
    });

});

Scenario('[C85619] Edit signature with HTML markup', async function (I, mail, dialogs) {

    await I.haveSnippet({
        content: '<p>Testsignaturecontent</p>',
        displayname: 'Testsignaturename',
        misc: { insertion: 'below', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);
    I.waitForText('Testsignaturename');
    I.see('Testsignaturecontent');

    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    I.fillField('Signature name', 'Newsignaturename');
    within({ frame: '.contenteditable-editor iframe' }, () => {
        I.fillField('body', 'Newsignaturecontent');
        I.retry(5).click('body');
        I.pressKey(['Control', 'a']);
    });
    I.click('.mce-i-bold');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    // assert changes
    I.see('Newsignaturename');
    I.see('Newsignaturecontent');

    I.openApp('Mail');
    mail.waitForApp();

    // compose a mail
    mail.newMail();
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.retry(5).seeElement(locate('strong').withText('Newsignaturecontent'));
    });

});
