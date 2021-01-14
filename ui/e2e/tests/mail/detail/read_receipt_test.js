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

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Read receipt block is displayed for read/unread mails (OXUIB-319)', async function ({ I, users, mail }) {
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

    // TODO: add check for sent folder for when MWB-633 get's fixed
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
    I.click('Send a read receipt');
    I.waitForDetached('.disposition-notification');
    I.logout();

    I.say('Third login: mail is seen and read receipt was send');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(subject);
    await within({ frame: '.mail-detail-frame' }, async function () {
        I.seeTextEquals('This mail has no content', 'body');
    });
    I.dontSee('Send a read receipt');
});
