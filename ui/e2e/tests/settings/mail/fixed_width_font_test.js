/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[7774] Fixed-font for plain-text mails', async ({ I, users }) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/tests/settings/mail/plain_text.eml'
    }, { user });

    I.login('app=io.ox/mail', { user });
    I.waitForText('plain text');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');
    within({ frame: '.mail-detail-frame' }, async () => {
        I.seeCssPropertiesOnElements('.mail-detail-content', { 'font-family': '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", Arial, sans-serif' });
    });
    I.logout();

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-settings');
    I.click('Use fixed-width font for text mails');

    I.click('Mail');
    I.waitForText('plain text');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');
    within({ frame: '.mail-detail-frame' }, async () => {
        I.seeCssPropertiesOnElements('.mail-detail-content', { 'font-family': 'monospace' });
    });
});
