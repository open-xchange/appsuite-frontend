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

Feature('Mail Compose');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[OXUIB-142] personal field of primary account should be respected', async ({ I, users, mail }) => {
    let [user] = users;
    const customDisplayNames = {};
    customDisplayNames[`${user.get('primaryEmail')}`] = {
        name: `${user.get('given_name')} ${user.get('sur_name')}`,
        overwrite: false,
        defaultName: `${user.get('given_name')} ${user.get('sur_name')}`
    };
    await I.haveSetting({
        'io.ox/mail': {
            features: { registerProtocolHandler: false },
            customDisplayNames,
            sendDisplayName: true
        }
    });
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');
    I.waitForVisible('.settings-list-item a.action');
    I.waitForText('Edit', 5, '.settings-list-item');
    I.retry(5).click('Edit');
    I.fillField('Your name', 'Entropy McDuck');
    I.click('Save');

    I.openApp('Mail');
    mail.newMail();

    // Verify the dislay name has changed
    I.see('Entropy McDuck');
});

Scenario('update account with mail compose app open', async ({ I, users, mail }) => {
    let [user] = users;
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');
    mail.newMail();

    // verify default display name
    I.see(`${user.get('given_name')} ${user.get('sur_name')}`);
    I.click(mail.locators.compose.close);

    I.openApp('Settings', { folder: 'virtual/settings/io.ox/settings/accounts' });
    I.waitForVisible('.settings-list-item a.action');
    I.waitForText('Edit', 5, '.settings-list-item');
    I.retry(5).click('Edit');
    I.fillField('Your name', 'Entropy McDuck');
    I.click('Save');

    I.openApp('Mail');
    mail.waitForApp();
    mail.newMail();

    // Verify the dislay name has changed
    I.see('Entropy McDuck');
});
