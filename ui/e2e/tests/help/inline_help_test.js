/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */

Feature('General > Inline help');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Open the help app in a floating window', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForVisible({ css: '[data-app-name="io.ox/mail"]' }, 5);

    I.click('~Online help');
    I.waitForVisible('.io-ox-help-window', 5);
    I.see('OX App Suite Help');

    // ensure that if you click help for the same active app only one window will open for that
    I.click('~Online help');
    I.waitForVisible('.io-ox-help-window', 5);
    I.seeNumberOfElements('.io-ox-help-window', 1);

    I.click('~Close', '.io-ox-help-window');
    I.waitForDetached('.io-io-help-window', 5);

    I.logout();
});

Scenario('Open the help app in a modal', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForVisible({ css: '[data-app-name="io.ox/mail"]' }, 5);

    I.click('Compose');
    I.retry().waitForVisible('.io-ox-mail-compose-window', 5);
    I.see('Compose', '.io-ox-mail-compose-window');

    I.waitForVisible({ css: 'div[data-extension-id="to"]' }, 5);
    I.wait(1);
    I.click('~Select contacts');
    I.waitForVisible('.modal.addressbook-popup', 5);

    I.click('~Online help', '.modal.addressbook-popup');
    I.waitForVisible('.modal.inline-help', 5);
    I.see('OX App Suite Help', '.modal.inline-help');

    I.click('Close', '.modal.inline-help');
    I.waitForDetached('.modal.inline-help', 5);

    I.click('Cancel', '.modal.addressbook-popup');
    I.waitForDetached('.modal.addressbook-popup', 5);

    I.logout();
});

Scenario('Check help window for supposed language', async function (I) {

    // check major languages
    var languages = {
        'de_DE': ['help/l10n/de_DE/ox.appsuite.user.sect.settings.globalsettings.html', 'Deutsch (Deutschland)', 'Grundeinstellungen anpassen', '~Schließen'],
        'en_US': ['help/l10n/en_US/ox.appsuite.user.sect.settings.globalsettings.html', 'English (United States)', 'How to customize the basic settings:', '~Close'],
        'en_GB': ['help/l10n/en_GB/ox.appsuite.user.sect.settings.globalsettings.html', 'English (United Kingdom)', 'How to customise the basic settings:', '~Close'],
        'es_ES': ['help/l10n/es_ES/ox.appsuite.user.sect.settings.globalsettings.html', 'Español (Espana)', '3.1. Personalización de la configuración básica', '~Cerrar'],
        'es_MX': ['help/l10n/es_MX/ox.appsuite.user.sect.settings.globalsettings.html', 'Español (México)', '3.1. Personalización de la configuración básica', '~Cerrar'],
        'fr_FR': ['help/l10n/fr_FR/ox.appsuite.user.sect.settings.globalsettings.html', 'Français (France)', '3.1. Personnaliser les réglages de base', '~Fermer'],
        'it_IT': ['help/l10n/it_IT/ox.appsuite.user.sect.settings.globalsettings.html', 'Italiano (Italia)', '3.1. Personalizzare le impostazioni di base', '~Chiudi'],
        'ja_JP': ['help/l10n/ja_JP/ox.appsuite.user.sect.settings.globalsettings.html', '日本語 (日本)', '3.1. 基本設定のカスタマイズ', '~閉じる'],
        'nl_NL': ['help/l10n/nl_NL/ox.appsuite.user.sect.settings.globalsettings.html', 'Nederlands (Nederland)', '3.1. Aanpassen van de basisinstellingen', '~Sluiten'],
        'pl_PL': ['help/l10n/pl_PL/ox.appsuite.user.sect.settings.globalsettings.html', 'Polski (Polska)', '3.1. Dostosowywanie ustawień podstawowych', '~Zamknij'],
        'tr_TR': ['help/l10n/tr_TR/ox.appsuite.user.sect.settings.globalsettings.html', 'Türkçe (Türkiye)', '3.1. Temel ayarları özelleştirme', '~Kapat'],
        'zh_CN': ['help/l10n/zh_CN/ox.appsuite.user.sect.settings.globalsettings.html', '中文 (简体)', '自定义基本设置', '~关闭'],
        'zh_TW': ['help/l10n/zh_TW/ox.appsuite.user.sect.settings.globalsettings.html', '中文 (繁體)', '自訂基礎設定', '~關閉']
    };

    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);

    I.waitForText('Basic settings', 5, '.rightside');

    for (let id in languages) {
        I.say(languages[id][1]);
        //Select language
        I.waitForElement('select[name="language"]');
        I.selectOption('select[name="language"]', languages[id][1]);

        // wait for "yell" so that the change arrived at server
        I.waitForVisible('.io-ox-alert', 30);
        I.refreshPage();
        I.refreshPage();

        I.waitForInvisible('#background-loader.busy', 20);
        I.waitForVisible('#settings-language', 5);

        //open help window
        I.waitForElement('#io-ox-context-help-icon', 20);
        I.click('#io-ox-context-help-icon');
        I.waitForElement('.inline-help-iframe', 20);

        //check language in help window
        I.waitForElement(locate('.inline-help-iframe').withAttr({ src: languages[id][0] }).inside('.io-ox-help-window'), 10);
        within({ frame: '.inline-help-iframe' }, () => {
            I.wait(1);
            I.waitForText(languages[id][2], 20);
        });

        //close help window
        I.click(languages[id][3], '.io-ox-help-window');
    }

    I.logout();

});


