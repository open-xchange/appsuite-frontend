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

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('Supports delayed autoselect', async function ({ I, mail, search }) {

    I.login('app=io.ox/mail');
    mail.waitForApp();
    var query = 'my-input';

    I.say('enter query');
    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);
    I.fillField(search.locators.field, query);

    I.dontSeeElement('.autocomplete-item');
    I.pressKey('Enter');

    I.say('check created token');
    I.waitForText(query, 2, '.token-label');
});
