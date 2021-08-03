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

Feature('Settings');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C110279] Primary mail account name can be changed', async function ({ I, dialogs }) {
    const name = 'Räuber Hotzenplotz';
    await I.haveFolder({ title: 'Personal', module: 'mail', parent: 'default0/INBOX' });
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/settings/accounts');

    I.say(`rename to "${name}"`, 'blue');
    I.retry(10).click('Edit');

    dialogs.waitForVisible();
    I.fillField('Account name', name);
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText('Account updated');
    I.waitForElement('.close', '.io-ox-alert');
    I.click('.close', '.io-ox-alert');
    I.waitForDetached('.io-ox-alert');

    I.say('check list item title', 'blue');
    I.waitForText(name, '.list-item-title');

    I.say('check mail folder view', 'blue');
    I.openApp('Mail');
    I.waitForElement('.tree-container');
    I.waitForText(name);
    I.seeTextEquals(name, '.tree-container [data-id= "virtual/myfolders"] > .folder-node .folder-label');
});
