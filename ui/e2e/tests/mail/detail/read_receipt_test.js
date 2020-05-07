/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

// TODO: wait for fix of MWB-288
Scenario.skip('Read receipt block is displayed for read/unread mails', async function (I, users, mail) {
    const subject = 'read receipt';
    await I.haveSetting({ 'io.ox/mail': { sendDispositionNotification: true } });

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();
    mail.newMail();

    I.say('Send mail with read receipt');
    I.click(mail.locators.compose.options);
    I.clickDropdown('Request read receipt');
    I.fillField('To', users[0].userdata.primaryEmail);
    I.fillField('Subject', subject);
    mail.send();
    I.logout();

    I.say('First login: mail is unseen');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(subject);
    I.waitForText('Send a read receipt');
    I.logout();

    I.say('Second login: mail is seen');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(subject);
    I.waitForText('Send a read receipt');
});
