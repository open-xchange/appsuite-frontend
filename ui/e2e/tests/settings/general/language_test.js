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

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7757] Set langugae', ({ I }) => {

    // check major languages
    var languages = {
        'de_DE': ['Grundeinstellungen', 'Deutsch (Deutschland)'],
        'en_US': ['Basic settings', 'English (United States)'],
        'es_ES': ['Configuración básica', 'Español (Espana)'],
        'fr_FR': ['Réglages de base', 'Français (France)'],
        'it_IT': ['Impostazioni di base', 'Italiano (Italia)'],
        'ja_JP': ['基本設定', '日本語 (日本)'],
        'pt_BR': ['Configurações básicas', 'Português (Brasil)']
    };

    // we start with en_US
    var previous = languages.en_US[0];

    for (var id in languages) {
        I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
        I.waitForText(previous);
        I.waitForElement({ css: 'select[name="language"]' });
        I.selectOption({ css: 'select[name="language"]' }, languages[id][1]);
        previous = languages[id][0];
        // wait for "yell" so that the change arrived at server
        I.waitForVisible('.io-ox-alert');
        I.logout();
    }

    // last time
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    I.waitForText(previous);
});
