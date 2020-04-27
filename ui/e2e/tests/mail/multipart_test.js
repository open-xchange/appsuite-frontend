/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('Mail > Misc');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[Bug 68343] Emails are not sent as HTML and text', async (I, users, mail) => {

    await I.haveSetting({
        'io.ox/mail': {
            messageFormat: 'alternative',
            // to force the html part to be returned as attachment
            allowHtmlMessages: false
        }
    });

    I.login('app=io.ox/mail');
    mail.waitForApp();

    mail.newMail();

    // switch to html editor (html mails create the text part, but text mails do not create the html part)
    I.click(mail.locators.compose.options);
    I.clickDropdown('HTML');
    I.waitForDetached('.dropup.open .dropdown-menu', 5);

    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Covfefe');
    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.fillField('body', 'No mail is more awesome than this!');
        I.pressKey('Enter');
    });

    I.click('Send');
    // check for detached not hidden because mail compose waits with closing the app until the send is completed
    I.waitForDetached('.io-ox-mail-compose-window');

    // give backend a bit of time here
    I.waitForVisible('.list-view .list-item', 15);
    I.click('.list-view .list-item');
    I.waitForVisible('.thread-view.list-view .list-item .mail-detail-frame');
    // text part
    await within({ frame: '.mail-detail-frame' }, async () => {
        I.waitForText('No mail is more awesome than this!');
    });
    // html part
    I.see('1 attachment');
});
