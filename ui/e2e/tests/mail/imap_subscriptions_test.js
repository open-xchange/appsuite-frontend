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

/// <reference path="../../steps.d.ts" />

const changeSubscription = (I, toggle) => {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail');
    I.waitForText('Change IMAP subscriptions ...');
    I.click('Change IMAP subscriptions ...');
    I.waitForVisible('.modal-dialog');
    I.waitForText('E-Mail');
    I.click('.modal-dialog .folder-arrow');
    I.waitForText('Krawall');
    if (toggle) {
        I.click('.folder [value="default0/INBOX/Krawall"]');
    }
    I.click('Save');
    I.waitForDetached('.modal-dialog');
};

const prepare = async (I) => {
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveFolder({ title: 'Krawall', module: 'mail', parent: 'default0/INBOX' });
    await I.haveFolder({ title: 'Remmidemmi', module: 'mail', parent: 'default0/INBOX' });
};

const goToMail = (I) => {
    I.openApp('Mail');
    I.waitForText('Inbox');
    I.doubleClick('.tree-container [data-model="virtual/myfolders"]');
    I.waitForText('Remmidemmi');
};

Feature('Settings > Mail > IMAP subscriptions');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[7783] Unsubscribe folder', async ({ I }) => {
    await prepare(I);

    changeSubscription(I, true);
    goToMail(I);
    I.dontSee('Krawall');
});

Scenario('[7784] Subscribe folder', async ({ I }) => {
    await prepare(I);

    changeSubscription(I);
    goToMail(I);
    I.see('Krawall');
});

