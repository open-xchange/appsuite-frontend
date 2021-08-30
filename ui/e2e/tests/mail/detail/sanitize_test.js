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

Feature('Mail > Detail');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C101624] Parsing CSS in HTML mails', async function ({ I }) {

    await I.haveMail({ folder: 'default0/INBOX', path:   'e2e/media/mails/c101624_1.eml' });
    await I.haveMail({ folder: 'default0/INBOX', path:   'e2e/media/mails/c101624_2.eml' });

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window .list-view');

    I.say('check c101624_1.eml', 'blue');
    I.waitForVisible('.list-item[data-index="0"]');
    I.click('.list-item[data-index="0"]', '.list-view');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.waitForVisible('.mail-detail-frame');
    await within({ frame: '.mail-detail-frame' }, async function () {
        I.seeTextEquals('HTML BODY', 'body');
    });

    I.say('check c101624_2.eml', 'blue');
    I.click('.list-item[data-index="1"]', '.list-view');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.waitForVisible('.mail-detail-frame');
    await within({ frame: '.mail-detail-frame' }, async function () {
        I.seeTextEquals('BODY 1', 'body');
    });
});

