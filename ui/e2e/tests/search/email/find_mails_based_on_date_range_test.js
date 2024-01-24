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

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8405] Find mails based on a date range', async ({ I, users }) => {

    // Precondition: Have some emails in the Inbox with timestamps from 2016 and 2017

    const USER = users[0];
    const INBOX = 'default0/INBOX';

    await I.haveMail({
        folder: INBOX,
        path: 'media/mails/c8405_2016.eml'
    }, { USER });

    await I.haveMail({
        folder: INBOX,
        path: 'media/mails/c8405_2017.eml'
    }, { USER });

    // 1. Switch to Mail

    I.login('app=io.ox/mail');

    // 2. Start typing a date rage (e.g. "01.01.2016 - 31.12.2016") into the search field

    I.waitForVisible('.search-box');
    I.click('.search-box');

    I.waitForElement('.search-box .token-input');
    I.fillField('.search-box .token-input', '01.01.2016 - 31.12.2016');

    // 3. Select '01.01.2016 - 31.12.2016 as daterange'

    I.waitForVisible({ css: '[data-id="range"]' });
    I.click({ css: '[data-id="range"]' });

    I.waitForText('2016', 5, '.list-view');
    I.dontSee('2017', '.list-view');

    I.click('~Remove');

    I.waitForText('2016', 5, '.list-view');
    I.waitForText('2017', 5, '.list-view');

    I.fillField('.search-box .token-input', '01.01.2017 - 31.12.2017');

    I.waitForVisible({ css: '[data-id="range"]' });
    I.click({ css: '[data-id="range"]' });

    I.waitForText('2017', 5, '.list-view');
    I.dontSee('2016', '.list-view');
});
