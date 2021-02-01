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

Feature('Mail > Reply/Forward');

Before(async ({ users }) => {
    await users.create(); // Recipient
    await users.create(); // Sender
    await users.create(); // CC
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7401] Mark multiple mails as read or unread', async ({ I, users }) => {
    // We need six mails in the Inbox, but then we'll work with five of them
    var i = 0, mails = [];
    for (i = 0; i < 5; i++) {
        mails.push(I.haveMail({
            from: [[users[0].get('display_name'), users[0].get('primaryEmail')]],
            sendtype: 0,
            subject: 'Hail Eris ' + i,
            to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
        }));
    }

    mails.push(I.haveMail({
        from: [[users[0].get('display_name'), users[0].get('primaryEmail')]],
        sendtype: 0,
        subject: 'All Hail Discordia',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }));
    await Promise.all(mails);

    // Test
    // Sign in as user_a and switch to inbox
    I.login('app=io.ox/mail');

    // Select several (not threaded) mails in the inbox.
    for (i = 0; i < 5; i++) {
        I.waitForElement(locate('.list-item').withText('Hail Eris ' + i));
        I.click('.list-item-checkmark', locate('.list-item').withText('Hail Eris ' + i));
    }

    // Click on "Mark Unread"
    I.click('~More actions');
    I.waitForElement('.dropdown-menu');
    I.click('Mark as read');
    for (i = 0; i < 5; i++) {
        I.dontSeeElement(locate('.seen-unseen-indicator')
            .inside(locate('.list-item')
                .withText('Hail Eris ' + i)
            )
        ); // List
    }

    I.click('~More actions');
    I.waitForElement('.dropdown-menu');
    I.click('Mark as unread');
    for (i = 0; i < 5; i++) {
        I.seeElement(locate('.seen-unseen-indicator')
            .inside(locate('.list-item')
                .withText('Hail Eris ' + i)
            )
        ); // List
    }
});

Scenario('[C7402] Mark one single mail as read or unread', async ({ I, users }) => {
    // Preparation

    // We need one mail in the Inbox
    await I.haveMail({
        from: [[users[0].get('display_name'), users[0].get('primaryEmail')]],
        sendtype: 0,
        subject: 'Hail Eris',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    });

    // Test
    // Sign in as user_a and switch to inbox
    I.login('app=io.ox/mail');
    // Select single (not threaded) mail.
    I.waitForElement(locate('li.list-item').withText('Hail Eris'));
    I.click(locate('li.list-item').withText('Hail Eris'));
    // -> Mail is displayed as read.
    I.waitForDetached('.mail-detail-pane article.mail-item.unread'); // Detail View
    I.waitForDetached(locate('.seen-unseen-indicator').inside(
        locate('.list-item').withText('Hail Eris')
    )); // List
    // Click on "Mark Unread"
    I.retry(5).click('.mail-detail-pane a.unread-toggle', '.mail-detail-pane article.mail-item');
    // -> Mail is displayed as unread.
    I.waitForElement('.mail-detail-pane article.mail-item.unread'); // Detail View
    I.waitForElement(locate('.seen-unseen-indicator')
        .inside(locate('.list-item').withText('Hail Eris')));  // List
    // Click on "Mark read"
    I.click('.mail-detail-pane a.unread-toggle', '.mail-detail-pane article.mail-item');
    // -> Mail is displayed as read.
    I.waitForDetached('.mail-detail-pane article.mail-item.unread'); // Detail View
    I.waitForDetached(locate('.seen-unseen-indicator').inside(
        locate('.list-item').withText('Hail Eris'))); // List
});

Scenario('[C8818] Reply all', async ({ I, users }) => {
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
    I.waitForInvisible('.io-ox-busy'); // wait for loading icon to disappear

    // Verify To: is the original sender
    I.seeElement(locate('div.token').withText(sender.get('display_name')).inside('[data-extension-id=to]'));
    // Verify CC: is the same cc as before
    I.seeElement(locate('div.token').withText(cc.get('display_name')).inside('[data-extension-id=cc]'));
    // Verify the subject is "Re: Hail Eris"
    I.seeInField('Subject', 'Re: Hail Eris');

    I.waitForElement('.window-footer [data-action="send"]:not([disabled])');
    I.wait(0.8);
    I.click('Send');
    I.waitForInvisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    // Verify the mail arrived at the other accounts
    [sender, cc].forEach(function (current_user) {
        I.logout();
        I.login('app=io.ox/mail', { user: current_user });
        I.waitForText('Re: Hail Eris', 5);
    });

});
