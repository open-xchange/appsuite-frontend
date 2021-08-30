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

// differrent variants in tinymce
const emptyLine = '(' +
    '<div><br></div>' + '|' +
    '<div><br>&nbsp;</div>' + '|' +
    '<div class="default-style"><br></div>' + '|' +
    '<div class="default-style"><br>&nbsp;</div>' +
')';

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[OXUIB-384] Image signature', async ({ I, dialogs }) => {
    await I.haveSnippet({
        content: '<div></div>',
        displayname: 'my-image-signature',
        misc: { insertion: 'below', 'content-type': 'text/plain' },
        module: 'io.ox/mail',
        type: 'signature'
    });
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);

    // edit
    I.waitForText('Add new signature');
    I.waitForText('my-image-signature');
    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    I.wait(0.5);

    I.attachFile('[data-name="image"] input[type="file"][name="file"]', 'e2e/media/images/ox_logo.png');
    I.wait(0.5);
    await within({ frame: '.io-ox-signature-dialog iframe' }, async () => {
        // insert some text
        var postHTML = await I.grabHTMLFrom('body');
        expect(postHTML).to.contain('<img src="/appsuite/api/file?action=get');
    });

    // save
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    // edit (once again)
    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    await within({ frame: '.io-ox-signature-dialog iframe' }, async () => {
        // insert some text
        var postHTML = await I.grabHTMLFrom('body');
        expect(postHTML).to.contain('src="/ajax/image/snippet/image?');
    });
});

// will probably break once MWB-290 was fixed/deployed
Scenario('[OXUIB-199] Sanitize signature preview', async ({ I }) => {
    const body = locate({ xpath: '//body' });
    await I.haveSnippet({
        content: 'blabla<i\nmg src="foo" oner\nror="document.body.classList.add(1337)" <br>',
        displayname: 'my-signature',
        misc: { insertion: 'below', 'content-type': 'text/plain' },
        module: 'io.ox/mail',
        type: 'signature'
    });
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);

    I.waitForText('Add new signature');
    I.waitForText('my-signature');
    I.dontSeeElement('.signature-preview img');
    I.wait(0.5);

    let classlist = await I.grabAttributeFrom(body, 'class');
    I.say(classlist);
    expect(classlist).to.not.contain(1337);
});

// will probably break once MWB-290 was fixed/deployed
Scenario('[OXUIB-200] Sanitize signature when editing existing', async ({ I, dialogs }) => {
    const body = locate({ xpath: '//body' });
    await I.haveSnippet({
        content: '<font color="<bo<script></script>dy><img alt=< src=foo onerror=document.body.classList.add(1337)></body>">',
        displayname: 'my-signature',
        misc: { insertion: 'below', 'content-type': 'text/plain' },
        module: 'io.ox/mail',
        type: 'signature'
    });
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/mail/settings/signatures']);

    I.waitForText('Add new signature');
    I.waitForText('my-signature');
    I.click('Edit');
    dialogs.waitForVisible();
    I.waitForVisible('.contenteditable-editor iframe');
    I.wait(0.5);

    let classlist = await I.grabAttributeFrom(body, 'class');
    expect(classlist).to.not.contain(1337);
});

Scenario('Sanitize entered signature source code', async ({ I }) => {

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

Scenario('[C7766] Create new signature', ({ I, mail, dialogs }) => {

    // init compose instance
    I.login(['app=io.ox/mail']);
    mail.waitForApp();
    mail.newMail();

    // predcondition: check signature menu refresh
    I.click(mail.locators.compose.options);
    I.waitForText('Signatures', 10, '.dropdown.open .dropdown-menu');
    I.pressKey('Escape');
    I.click({ css: '[data-action=minimize]' });

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/mail/settings/signatures' });
    I.waitForText('Add new signature');
    I.click('Add new signature');
    dialogs.waitForVisible();

    I.waitForVisible('.io-ox-signature-dialog .contenteditable-editor iframe');
    I.fillField('Signature name', 'Testsignaturename');

    within({ frame: '.io-ox-signature-dialog .contenteditable-editor iframe' }, () => {
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

    // use compose instance to check signature menu refresh
    I.waitForVisible('#io-ox-taskbar-container button');
    I.click('#io-ox-taskbar-container button');
    I.waitForElement(mail.locators.compose.options);
    I.click(mail.locators.compose.options);

    I.clickDropdown('Testsignaturename');

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.see('Testsignaturecontent');
    });

});

Scenario('[C7767] Define signature position', async ({ I, users, mail, dialogs }) => {
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

Scenario('[C7768] Edit signature', async ({ I, mail, dialogs }) => {
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

    I.waitForVisible(mail.locators.compose.options);
    I.click(mail.locators.compose.options);
    I.clickDropdown('Newsignaturename');

    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.see('Newsignaturecontent');
    });

});

Scenario('[C7769] Delete signature', async ({ I }) => {
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

    I.click('~Delete');
    I.waitForDetached('.settings-list-item');

    I.dontSee('Testsignaturename');
    I.dontSee('Testsignaturecontent');

});

Scenario('[C7770] Set default signature', async ({ I, users, mail }) => {
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
    mail.waitForApp();

    // compose a mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, () => {
        I.waitForVisible('body');
        I.wait(0.5);
        I.see('Testsignaturecontent1');
    });
    I.click(mail.locators.compose.close);

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

Scenario('[C85619] Edit signature with HTML markup', async ({ I, mail, dialogs }) => {

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
