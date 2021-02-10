/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
