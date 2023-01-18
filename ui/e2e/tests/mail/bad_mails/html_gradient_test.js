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

Scenario('[C101616] HTML gradient', async function ({ I, users, mail }) {
    const [user] = users;
    await Promise.all([
        I.haveMail({
            folder: 'default0/INBOX',
            path: 'media/mails/C101616.eml'
        }, { user }),
        I.haveSetting('io.ox/mail//allowHtmlImages', true)
    ]);
    I.login('app=io.ox/mail');
    I.waitForText('HTML gradient');
    mail.selectMail('HTML gradient');
    I.waitForText('There should be a 300px high td around me with a CSS gradient');
    within({ frame: '.mail-detail-frame' }, () => {
        I.seeElement(locate('table').withAttr({ class: 'head-wrap', height: '300px' }));
    });
});
