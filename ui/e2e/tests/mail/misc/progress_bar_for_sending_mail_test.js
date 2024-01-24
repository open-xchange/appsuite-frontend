/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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
