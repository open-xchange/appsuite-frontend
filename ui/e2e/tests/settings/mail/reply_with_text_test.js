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

Scenario('[C7776] Insert the original email text to a reply', async ({ I, users, mail }) => {
    const user = users[0];
    const listview = locate('.list-view-control').as('List View');

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/tests/settings/mail/plain_text.eml'
    }, { user });

    I.login('app=io.ox/mail', { user });
    mail.waitForApp();
    I.waitForText('plain text', 5, listview);
    I.click('.list-item.selectable', listview);
    I.waitForVisible('h1.subject');
    I.waitForText('Reply');
    I.click('Reply');
    I.waitForElement('.io-ox-mail-compose textarea');
    I.seeInField('textarea', '> This is simple plain text!');

    I.click(mail.locators.compose.close);
    I.logout();

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail/settings/compose', { user });
    I.waitForText('Mail Compose');
    I.click('Insert the original email text to a reply');

    I.openApp('Mail');
    mail.waitForApp();
    I.waitForText('plain text', 5, listview);
    I.click('.list-item.selectable', listview);
    I.waitForVisible('h1.subject');
    I.waitForText('Reply');
    I.click('Reply');
    I.waitForText('Re: plain text');
    I.waitForElement('.io-ox-mail-compose .editor iframe');
    await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.dontSee('This is simple plain text!');
    });
});
