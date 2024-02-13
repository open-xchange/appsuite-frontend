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

Feature('Mail > Folderview');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[OXUIB-64] Mark folders as favorites', async ({ I, mail }) => {
    await I.haveSetting('io.ox/core//favorites/mail', ['default0']);
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForVisible('.folder.virtual.favorites .folder-arrow');
    I.click('.folder.virtual.favorites .folder-arrow');
    I.rightClick('.folder.virtual.favorites .folder[data-id="default0"] .folder-node');
    I.click('Remove from favorites');
    I.dontSee('Favorites');
});
