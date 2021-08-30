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

Feature('Primary mail account');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7838] Edit primary mail account', async ({ I, mail, settings, dialogs }) => {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/settings');
    settings.waitForApp();
    settings.select('Accounts');
    I.waitForVisible('~Edit E-Mail');
    I.retry(10).click('~Edit E-Mail');
    dialogs.waitForVisible();
    I.fillField('Account name', 'OX-Mail');
    I.fillField('Your name', 'Buckaroo Banzai');
    I.seeAttributesOnElements('input[name="primary_address"]', { disabled: true });
    I.seeAttributesOnElements('select[name="mail_protocol"]', { disabled: true });
    I.seeAttributesOnElements('input[name="mail_server"]', { disabled: true });
    I.seeAttributesOnElements('select[name="mail_secure"]', { disabled: true });
    I.seeAttributesOnElements('input[name="mail_port"]', { disabled: true });
    I.seeAttributesOnElements('input[name="login"]', { disabled: true });
    I.seeAttributesOnElements('input[id="password"]', { disabled: true });
    I.seeAttributesOnElements('input[name="transport_server"]', { disabled: true });
    I.seeAttributesOnElements('select[name="transport_secure"]', { disabled: true });
    I.seeAttributesOnElements('input[name="transport_port"]', { disabled: true });
    I.seeAttributesOnElements('select[name="transport_auth"]', { disabled: true });
    I.seeAttributesOnElements('input[name="transport_login"]', { disabled: true });
    I.seeAttributesOnElements('input[id="transport_password"]', { disabled: true });
    dialogs.clickButton('Save');
    I.waitForDetached('.modal');
    I.waitForText('OX-Mail');
    I.click('~Mail');
    mail.waitForApp();
    mail.newMail();
    I.see('Buckaroo Banzai');
});
