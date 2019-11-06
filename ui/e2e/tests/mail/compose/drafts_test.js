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

Scenario('[C114967] Draft is created automatically on logout', async function (I, mail) {

    const mailSubject = 'C114967';
    const defaultText = 'Draft is created automatically on logout';

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');

    mail.newMail();

    // Fill out to and subject
    I.fillField('Subject', mailSubject);

    // Write some text with the default settings
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.fillField({ css: 'body' }, defaultText);
        I.pressKey('Enter');
        I.pressKey('Enter');
    });

    // Let's stick around a bit for sending to finish
    I.wait(1);
    I.logout();

    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForText(mailSubject, 5, '#io-ox-taskbar');
    I.click(mailSubject, '#io-ox-taskbar');
    I.waitForElement(iframeLocator, 10);

    await within({ frame: iframeLocator }, async () => {
        I.waitForText(defaultText, 5, { css: 'body' });
    });
});
