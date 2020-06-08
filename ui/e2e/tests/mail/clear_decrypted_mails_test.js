/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ben Ehrengruber <ben.ehrengruber@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('Settings > Mail');

Before(async (users) => {
    await Promise.all([
        users.create()
    ]);
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C308519] Clear decrypted emails from cache', (I, mail, dialogs, portal, settings, users) => {
    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();

    //Write new Mail
    I.clickToolbar('Compose');

    //Wait for compose dialog
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');

    //Switch to plain text
    I.click(mail.locators.compose.options);
    I.click('Plain Text');

    //Write mail
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'This is a signed mail');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');


    //encrypt email
    I.click('.toggle-encryption');

    //wait for guard setup dialog
    I.waitForVisible('.wizard-step');

    //Setup Guard
    I.click('Start Setup');
    I.fillField('Password', 'secret');
    I.fillField('Confirm', 'secret');
    I.fillField('input[name="recoverymail"]', 'nowhere@void.com');
    I.click('Next');

    //close setup
    I.waitForText('Guard set up completed');
    I.click('Close');

    //Send mail
    I.click('Send');

    //wait for email to arrive
    I.waitForElement('.list-item.unread', 20);

    //open email
    I.click(locate('.list-item.unread').first());
    I.waitForText(users[0].get('primaryEmail'));

    //wair for guard password request
    I.waitForText('Secure Email, enter your Guard security password.');

    //enter password
    I.fillField(locate('.password_prompt').first(), 'secret');
    I.click('OK');

    //check content
    I.waitForElement('.mail-detail-frame');

    //switch app
    I.openApp('Portal');
    portal.waitForApp();

    //switch back
    I.openApp('Mail');
    mail.waitForApp();

    //open mail
    I.waitForElement('.list-item', 20);
    I.click(locate('.list-item').first());
    I.waitForText(users[0].get('primaryEmail'));
    I.waitForElement('.mail-detail-frame');

    //open settings
    I.openApp('Settings');
    settings.waitForApp();
    settings.select('Security');
    settings.select('Guard');

    //open advanced setting
    I.checkOption('Show advanced settings');

    //disable encrypted mail cache
    I.waitForText('Do not keep emails decrypted.');
    I.click(locate('label').withText('Do not keep emails decrypted.'));

    //check if mail gets cleared from cache after closing mail
    //switch to mail
    I.openApp('Mail');
    mail.waitForApp();

    //open email
    I.waitForElement('.list-item', 20);
    I.doubleClick(locate('.list-item').first());
    I.waitForText(users[0].get('primaryEmail'));

    //wair for guard password request
    I.waitForText('Secure Email, enter your Guard security password.');

    //enter password
    I.fillField(locate('.password_prompt').first(), 'secret');
    I.click('OK');

    //check content
    I.waitForElement('.mail-detail-frame');

    //close mail
    I.click('button[data-action="close"]');

    //switch app
    I.openApp('Portal');
    portal.waitForApp();

    //switch back
    I.openApp('Mail');
    mail.waitForApp();

    //ckech again
    //open email
    I.waitForElement('.list-item', 20);
    I.doubleClick(locate('.list-item').first());
    I.waitForText(users[0].get('primaryEmail'));

    //wair for guard password request
    I.waitForText('Secure Email, enter your Guard security password.');

    //enter password
    I.fillField(locate('.password_prompt').first(), 'secret');
    I.click('OK');

    //check content
    I.waitForElement('.mail-detail-frame');

    //close mail
    I.click('button[data-action="close"]');

    //logout
    I.logout();
});
