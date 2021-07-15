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

Feature('Client Onboarding > Tours');

//create users
Before(async ({ users }) => {
    await users.create();
});

//delete users
After(async ({ users }) => {
    await users.removeAll();
});

Scenario.skip('[C303317] Welcome Tour', ({ I, mail }) => {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    //Open tour dialog
    I.click('#io-ox-topbar-help-dropdown-icon');
    I.clickDropdown('Getting started');

    //Wait for dialog to open
    I.waitForVisible('.wizard-step');

    //Check correct Step is displayed 1/5 - Welcome OX App suite
    I.waitForText('Welcome to OX App Suite');
    I.click('Start tour');

    //Check correct Step is displayed 2/5 - Navigation
    I.waitForText('Navigation');
    I.seeElement('.hotspot');
    I.seeElement('.launcher-dropdown');
    I.click('Next');

    //Check correct Step is displayed 3/5 - Personal Settings
    I.waitForText('Personal settings');
    I.seeElement('.hotspot');
    I.seeElement('#topbar-settings-dropdown');
    I.click('Next');

    //Check correct Step is displayed 4/5 - Settings
    I.waitForText('Settings');
    I.seeElement('.hotspot');
    I.click('Next');

    //Check correct Step is displayed 5/5 - Help
    I.waitForText('Help');
    I.seeElement('.hotspot');
    I.click('Finish');

    //close session
    I.logout();
});
