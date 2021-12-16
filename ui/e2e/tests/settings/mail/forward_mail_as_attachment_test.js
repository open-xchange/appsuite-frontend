/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
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

Scenario('[C7778] Forwarding mail inline/attachment', async ({ I, users, mail }) => {
    const user = users[0];

    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveSetting('io.ox/mail//attachments/layout/detail/open', true);
    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/tests/settings/mail/test.eml'
    }, { user });

    I.login('app=io.ox/mail', { user });
    mail.waitForApp();
    mail.selectMail('Richtig gutes Zeug');
    I.waitForVisible('h1.subject');
    I.click('Forward');
    I.waitForText('Fwd: Richtig gutes Zeug');
    I.waitForElement('.io-ox-mail-compose-window .editor iframe');
    within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
        I.waitForText('---------- Original Message ----------');
    });
    I.wait(0.5);

    I.waitToHide('Saving');
    I.click(mail.locators.compose.close);
    I.waitForDetached('.io-ox-mail-compose-window');
    I.logout();

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail/settings/compose', { user });
    I.waitForText('Mail Compose');
    I.click('Attachment');
    I.openApp('Mail');

    mail.selectMail('Richtig gutes Zeug');
    I.waitForVisible('h1.subject');
    I.click('Forward');
    I.waitForText('Fwd: Richtig gutes Zeug');
    I.waitForFocus('[placeholder="To"]');
    I.fillField('To', user.get('primaryEmail'));
    mail.send();
    I.triggerRefresh();
    mail.selectMail('Fwd: Richtig gutes Zeug');
    I.waitForVisible('h1.subject');
    I.see('Richtig_gutes_Zeug.eml');
});
