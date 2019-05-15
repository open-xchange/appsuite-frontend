/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

const iframeLocator = '.io-ox-mail-compose-window .editor iframe';

Scenario('[C114967] Draft is created automatically on logout', async function (I) {

    const mailSubject = 'C114967';
    const defaultText = 'Draft is created automatically on logout';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');

    // Open the mail composer
    I.retry(5).click('Compose');
    I.waitForElement('.io-ox-mail-compose .contenteditable-editor');

    // Fill out to and subject
    I.waitForFocus('input[placeholder="To"]');
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.pressKey(defaultText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Let's stick around a bit for sending to finish
    I.wait(1);
    I.logout();

    I.login('app=io.ox/mail');

    I.see(mailSubject, '#io-ox-taskbar');

    I.click('[data-action="restore"]', '#io-ox-taskbar');
    I.waitForFocus('input[placeholder="To"]');

    await within({ frame: iframeLocator }, async () => {
        I.see(defaultText);
    });

    I.logout();
});
