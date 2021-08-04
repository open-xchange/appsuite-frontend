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

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[7772] No contact collection when sending mail', async ({ I }) => {
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');

    I.waitForText('Compose');
    I.clickToolbar('Compose');

    I.waitForFocus('[placeholder="To"]');
    I.fillField('To', 'urbi@orbi.vat');
    I.fillField('Subject', 'Richtig gutes zeug');
    I.click('Send');
    I.waitForVisible('#io-ox-launcher');

    I.openApp('Address Book');
    I.click('#io-ox-refresh-icon');
    I.waitForText('My address books');
    I.doubleClick('~My address books');
    I.selectFolder('Collected addresses');
    I.waitForText('Empty', 3);
});
