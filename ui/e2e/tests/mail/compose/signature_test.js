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
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose > Signatures');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});


Scenario('[C8825] Add and replace signatures', async function (I, mail) {

    await Promise.all([
        I.haveSnippet({
            content: '<p>Very original and clever signature</p>',
            displayname: 'My signature',
            misc: { insertion: 'above', 'content-type': 'text/html' },
            module: 'io.ox/mail',
            type: 'signature'
        }),
        I.haveSnippet({
            content: '<p>Super original and fabulous signature</p>',
            displayname: 'Super signature',
            misc: { insertion: 'above', 'content-type': 'text/html' },
            module: 'io.ox/mail',
            type: 'signature'
        })
    ]);

    I.login('app=io.ox/mail');
    mail.newMail();
    I.click(mail.locators.compose.signatures);

    I.waitForText('My signature', 5, '.dropdown.open .dropdown-menu');
    I.click('My signature', '.dropdown.open .dropdown-menu');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText('Very original and clever signature');
    });
    I.click(mail.locators.compose.signatures);
    I.waitForText('Super signature', 5, '.dropdown.open .dropdown-menu');
    I.click('Super signature', '.dropdown.open .dropdown-menu');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForText('Super original and fabulous signature');
        I.dontSee('Very original and clever signature');
    });
});

Scenario('[C265555] Change the Signature', async function (I, mail, dialogs) {

    const firstSignatureContent = 'Very original and clever signature',
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
            })
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
    dialogs.clickButton('Save as draft');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-mail-compose');

    I.selectFolder('Drafts');
    mail.selectMail('test subject');

    I.clickToolbar('.io-ox-mail-window .classic-toolbar [data-action="more"]');
    I.waitForElement('.dropdown.open');
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
    I.click(mail.locators.compose.signatures);
    I.waitForElement('.dropdown.open');
    I.click('Super signature', '.dropdown.open .dropdown-menu');
    within({ frame: '#mce_1_ifr' }, () => {
        I.waitForVisible(locate('div.io-ox-signature').withText(secondSignatureContent));
        I.waitForVisible(locate('blockquote').withText(firstSignatureContent));
    });
});

Scenario('Use image-only signature', async function (I, mail) {
    await I.haveSnippet({
        content: `<p><img src="${getBas64Image()}"></p>`,
        displayname: 'My image signature',
        misc: { insertion: 'above', 'content-type': 'text/html' },
        module: 'io.ox/mail',
        type: 'signature'
    });

    I.login('app=io.ox/mail');
    mail.newMail();
    I.click(mail.locators.compose.signatures);
    I.waitForText('My image signature');
    I.click('My image signature');
    within({ frame: '#mce_0_ifr' }, () => {
        I.waitForElement('img');
    });
});

function getBas64Image() {
    return 'data:image/png;base64,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';
}
