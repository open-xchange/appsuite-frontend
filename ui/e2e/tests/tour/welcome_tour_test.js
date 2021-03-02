/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ben Ehrengruber <ben.ehrengruber@open-xchange.com>
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
    I.click('#io-ox-topbar-dropdown-icon');
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
