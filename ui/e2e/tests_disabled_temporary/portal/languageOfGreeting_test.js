/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7496] Language of Greeting', async ({ I, topbar }) => {

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
    topbar.settings();

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

