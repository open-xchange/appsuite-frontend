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

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C114373] Search in all folders', async function ({ I, users, mail }) {
    let [user] = users;
    user.hasConfig('com.openexchange.find.basic.mail.allMessagesFolder', 'virtual/all');
    user.hasConfig('com.openexchange.find.basic.mail.searchmailbody', true);
    await Promise.all([
        I.haveFolder({ title: 'Subfolder', module: 'mail', parent: 'default0/INBOX' }),
        I.haveMail({
            folder: 'default0/INBOX/Subfolder',
            path: 'e2e/tests/settings/mail/test.eml'
        }, { user })
    ]);
    I.login();
    mail.waitForApp();
    I.fillField('Search...', 'Foo');
    I.waitForText('Inbox', '.io-ox-find');
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
    I.waitForText('Search in all folders', '.list-view');
    I.click('Search in all folders');
    I.waitForText('All Folders', '.io-ox-find');
    I.waitForText('Richtig gutes Zeug');
});

