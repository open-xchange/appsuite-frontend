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

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail > Mailfilter');

Before(async (users) => {
    await Promise.all([
        users.create()
    ]);
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C303925] Mail filter OX Guard Integration', (I, settings, mail, dialogs, users) => {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter', { user: users[0] });
    settings.waitForApp();

    //Add new Rule
    I.waitForText('Add new rule');
    I.click('Add new rule');

    //Enter name
    dialogs.waitForVisible();
    I.fillField('#rulename', 'Secure');

    //Add condition
    I.click('Add condition');
    I.clickDropdown('PGP signature');

    //Add action
    I.click('Add action');
    I.clickDropdown('Encrypt the email');

    //Apply new rule
    I.click('Save');

    //switch to mail app
    I.openApp('Mail');
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

    //Send mail
    I.click('Send');

    //wait for email to arrive
    I.waitForElement('.list-item.unread', 20);

    //open email
    I.click(locate('.list-item.unread').first());
    I.waitForText(users[0].get('primaryEmail'));


    //check for flag
    I.dontSee('i.fa-lock.encrypted');

    //Write new Mail
    I.clickToolbar('Compose');

    //Wait for compose dialog
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');

    //Switch to plain text
    I.click(mail.locators.compose.options);
    I.click('Plain Text');

    //Sign email
    I.click(mail.locators.compose.options);
    I.forceClick('Sign email');

    //Write mail
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'This is a signed mail');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    //Send mail
    I.click('Send');

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

    //enter password
    I.waitForText('Password needed');
    I.fillField('#ogPassword', 'secret');
    I.click('OK');

    //wait for email to arrive
    I.waitForElement('.list-item.unread', 20);

    //open email
    I.click(locate('.list-item.unread').first());
    I.waitForText(users[0].get('primaryEmail'));

    //check for flag
    I.seeElement('i.fa-lock.encrypted');

    I.logout();
});
