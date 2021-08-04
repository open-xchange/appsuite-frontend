/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Print');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C44997] Print a E-Mail', async ({ I, mail }) => {
    await I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/c44997.eml' });

    // 1. Go to Mail -> Compose
    I.login('app=io.ox/mail');

    // 1. Select the E-Mail
    mail.selectMail('Testsubject');

    // 2. Click "Print"
    I.click('~More actions');
    I.click('Print', '.dropdown.open .dropdown-menu');

    // 3. The printed mail matches the selected mail
    // need to wait here until the browser closed the print window. 5 might be too long but is also super safe
    I.wait(5);
    I.retry(5).switchToNextTab();
    I.waitForText('Testsubject');
    I.see('Lorem ipsum dolor sit amet');
    I.see('4/21/2020 3:53 PM');
    I.see('Jane\u00A0Doe\u00A0<jane@doe.com>');
    I.see('To John\u00A0Doe\u00A0<john@doe.com>');
});
