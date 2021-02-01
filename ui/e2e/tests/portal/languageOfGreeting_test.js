/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Olena Stute <olena.stute@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7496] Language of Greeting', async ({ I }) => {

    const expect = require('chai').expect;

    // set language
    await I.haveSetting('io.ox/core//language', 'de_DE');
    //await I.haveSetting('io.ox/core//timezone', 'Pacific/Easter');
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveSetting('io.ox/core//showDesktopNotifications', false);

    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.waitForVisible('.greeting-phrase');
    const greeting = await I.grabTextFrom('.greeting-phrase');

    //Verify greeting in de_DE
    expect(greeting).to.match(/^Hallo|^Guten Morgen|^Guten Abend/);

    //Re-login with fr_FR
    I.click('#io-ox-settings-topbar-icon');
    I.waitForText('Grundeinstellungen');
    I.waitForText('Sprache');
    I.selectOption('select[name="language"]', 'fr_FR');
    I.waitForText('Zeitzone');
    I.waitForVisible('.io-ox-alert');

    I.refreshPage();
    I.waitForText('Recharger la page');

    //Get greeting
    I.openApp('Portail');
    I.waitForVisible('.greeting-phrase');
    const updated_greeting = await I.grabTextFrom('.greeting-phrase');

    //Verify greeting in fr_FR
    expect(updated_greeting).to.match(/^Bonjour|^Bonsoir/);

});

