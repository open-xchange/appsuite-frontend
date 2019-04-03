/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Francisco Laguna <francisco.laguna@open-xchange.com>
*/

/// <reference path="../../steps.d.ts" />

Feature('Mail > Reply / Forward');

Before(async (users) => {
    await users.create(); // Recipient
    await users.create(); // Sender
    await users.create(); // CC
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C8818] Reply all', async (I, users) => {
    const [recipient, sender, cc] = users;

    // Preparation
    // Generate the email we want to reply to
    await I.haveMail({
        from: [[sender.get('display_name'), sender.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Hail Eris',
        to: [[recipient.get('display_name'), recipient.get('primaryEmail')]],
        cc: [[cc.get('display_name'), cc.get('primaryEmail')]]
    }, { user: sender });
    // Suppress mailto: popup
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    // Test
    // Sign in and switch to mail app
    I.login('app=io.ox/mail', { user: recipient });
    // Select single the email.
    I.waitForElement(locate('li.list-item').withText('Hail Eris'));
    I.click(locate('li.list-item').withText('Hail Eris'));
    // Hit reply
    I.waitForText('Reply all');
    I.click('Reply all');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');

    // Verify To: is the original sender
    I.seeElement(locate('div.token').withText(sender.get('display_name')).inside('[data-extension-id=to]'));
    // Verify CC: is the same cc as before
    I.seeElement(locate('div.token').withText(cc.get('display_name')).inside('[data-extension-id=cc]'));
    // Verify the subject is "Re: Hail Eris"
    I.seeInField('Subject', 'Re: Hail Eris');

    I.click('Send');
    I.waitForInvisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.logout();
    // Verify the mail arrived at the other accounts
    [sender, cc].forEach(function (current_user) {
        I.login('app=io.ox/mail', { user: current_user });
        I.waitForText('Re: Hail Eris', 5);
        I.logout();
    });


});
