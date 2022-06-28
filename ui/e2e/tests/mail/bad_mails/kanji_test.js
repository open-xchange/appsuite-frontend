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

///  <reference path="../../../steps.d.ts" />

Scenario('[C101621] Kanji', async function ({ I, users, mail }) {
    const [user] = users;
    await I.haveMail({ folder: 'default0/INBOX', path: 'media/mails/C101621.eml' }, { user });
    I.login('app=io.ox/mail');
    I.waitForText('Kanji');
    mail.selectMail('Kanji');
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.see('我给你的');
        I.seeElement({ css: 'a[href="mailto:test@gmail.com"]' });
        I.see('发了一封邮');
    });
});

