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

Scenario('[7773] Contact collection when reading mail', async ({ I, users }) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/tests/settings/mail/test.eml'
    }, { user });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-settings');
    I.click('Automatically collect contacts in the folder "Collected addresses" while reading');

    I.openApp('Mail');
    I.waitForText('Richtig gutes Zeug');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');

    I.openApp('Address Book');
    I.click('#io-ox-refresh-icon');
    I.waitForText('My address books', 5);
    I.doubleClick('~My address books');

    I.selectFolder('Collected addresses');
    I.waitForText('John Doe');
});
