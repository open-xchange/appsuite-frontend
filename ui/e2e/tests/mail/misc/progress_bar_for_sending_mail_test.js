/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Misc');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C85616] Progress bar for sending mail', async ({ I, users }) => {

    // 1. Go to Mail -> Compose

    I.login('app=io.ox/mail');
    I.clickToolbar('Compose');
    I.waitForElement('.io-ox-mail-compose');
    I.waitForVisible('.window-blocker.io-ox-busy');
    I.waitForInvisible('.window-blocker.io-ox-busy');

    // 2. Send a mail with big attachments to yourself.

    I.click({ css: '[data-extension-id="to"] input.tt-input' });
    I.wait(1); // wait for autofocus
    I.fillField({ css: '[data-extension-id="to"] input.tt-input' }, users[0].get('primaryEmail'));
    I.fillField('Subject', 'My Subject');

    I.click('Send');
    I.waitForInvisible('.io-ox-mail-compose');
    I.waitForElement('.mail-progress');
    I.waitForInvisible('.mail-progress');

    // 3. Verify that the mail is sent successfully

    // wait for mail delivery
    I.waitForVisible(locate('.list-item[aria-label*="My Subject"]').inside('.list-view'), 30);
});
