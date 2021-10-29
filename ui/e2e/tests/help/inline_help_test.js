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

Feature('General > Inline help');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Open the help app in a floating window', async function ({ I, mail, topbar }) {
    I.login('app=io.ox/mail');
    I.waitForVisible({ css: '.io-ox-mail-window' }, 5);

    I.say('case: same app');
    // mail app
    topbar.help();
    I.waitForVisible('.io-ox-help-window', 5);
    I.see('OX App Suite Help');
    // mail app
    topbar.help();
    I.seeNumberOfElements('.io-ox-help-window', 1);
    I.click('~Close', '.io-ox-help-window');
    I.waitForDetached('.io-io-help-window', 5);

    I.say('case: different apps');
    // mail app
    topbar.help();
    I.waitForVisible('.io-ox-help-window', 5);
    I.see('OX App Suite Help');
    // mail compose app
    mail.newMail();
    topbar.help();
    I.seeNumberOfElements('.io-ox-help-window', 2);
});

Scenario('Open the help app in a modal', async function ({ I, mail, dialogs }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();

    I.click('~Select contacts');
    dialogs.waitForVisible();

    I.click('~Online help', dialogs.locators.header);
    I.waitForVisible('.modal.inline-help', 5);
    I.see('OX App Suite Help', dialogs.locators.header);

    dialogs.clickButton('Close');
    I.waitForDetached('.modal.inline-help');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});

Scenario('Check help window for supposed language', function ({ I, topbar }) {

    // check major languages
    var languages = {
        'de_DE': ['help/l10n/de_DE/ox.appsuite.user.sect.settings.globalsettings.html', 'Deutsch (Deutschland)', 'Grundeinstellungen anpassen', '~Schließen'],
        'en_US': ['help/l10n/en_US/ox.appsuite.user.sect.settings.globalsettings.html', 'English (United States)', 'How to customize the basic settings:', '~Close'],
        'en_GB': ['help/l10n/en_GB/ox.appsuite.user.sect.settings.globalsettings.html', 'English (United Kingdom)', 'How to customise the basic settings:', '~Close'],
        'es_ES': ['help/l10n/es_ES/ox.appsuite.user.sect.settings.globalsettings.html', 'Español (Espana)', 'Personalización de la configuración básica', '~Cerrar'],
        'es_MX': ['help/l10n/es_MX/ox.appsuite.user.sect.settings.globalsettings.html', 'Español (México)', 'Personalización de la configuración básica', '~Cerrar'],
        'fr_FR': ['help/l10n/fr_FR/ox.appsuite.user.sect.settings.globalsettings.html', 'Français (France)', 'Personnaliser les réglages de base', '~Fermer'],
        'it_IT': ['help/l10n/it_IT/ox.appsuite.user.sect.settings.globalsettings.html', 'Italiano (Italia)', 'Personalizzare le impostazioni di base', '~Chiudi'],
        'ja_JP': ['help/l10n/ja_JP/ox.appsuite.user.sect.settings.globalsettings.html', '日本語 (日本)', '基本設定のカスタマイズ', '~閉じる'],
        'nl_NL': ['help/l10n/nl_NL/ox.appsuite.user.sect.settings.globalsettings.html', 'Nederlands (Nederland)', 'Aanpassen van de basisinstellingen', '~Sluiten'],
        'pl_PL': ['help/l10n/pl_PL/ox.appsuite.user.sect.settings.globalsettings.html', 'Polski (Polska)', 'Dostosowywanie ustawień podstawowych', '~Zamknij'],
        'tr_TR': ['help/l10n/tr_TR/ox.appsuite.user.sect.settings.globalsettings.html', 'Türkçe (Türkiye)', 'Temel ayarları özelleştirme', '~Kapat'],
        'zh_CN': ['help/l10n/zh_CN/ox.appsuite.user.sect.settings.globalsettings.html', '中文 (简体)', '自定义基本设置', '~关闭'],
        'zh_TW': ['help/l10n/zh_TW/ox.appsuite.user.sect.settings.globalsettings.html', '中文 (繁體)', '自訂基礎設定', '~關閉']
    };

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);

    I.waitForText('Basic settings', 5, '.rightside');

    for (let id in languages) {
        I.say(languages[id][1]);
        //Select language
        I.waitForElement({ css: 'select[name="language"]' });
        I.selectOption({ css: 'select[name="language"]' }, languages[id][1]);

        // wait for "yell" so that the change arrived at server
        I.waitForVisible('.io-ox-alert', 30);
        I.refreshPage();
        I.refreshPage();

        I.waitForInvisible('#background-loader.busy', 20);
        I.waitForVisible('#settings-language', 5);

        //open help window
        topbar.help();

        //check language in help window
        I.waitForElement(locate('.inline-help-iframe').withAttr({ src: languages[id][0] }).inside('.io-ox-help-window'), 10);
        within({ frame: '.inline-help-iframe' }, () => {
            I.wait(1);
            I.waitForText(languages[id][2], 20);
        });

        //close help window
        I.click(languages[id][3], '.io-ox-help-window');
        I.waitForDetached('.io-ox-help-window');
    }
});


