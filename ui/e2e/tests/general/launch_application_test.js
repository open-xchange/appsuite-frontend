/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Sonja Doerr <sonja.doerr@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('General > App Launcher');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7343] Launch "Portal" application', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Portal');
    I.waitForElement('.greeting-phrase');
    I.logout();
});

Scenario('[C7344] Launch "E-Mail" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Mail', '.launcher-dropdown');
    I.waitForText('Compose');
    I.logout();
});

Scenario('[C7345] Launch "Address Book" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Address Book', '.launcher-dropdown');
    I.waitForElement('.classic-toolbar[aria-label="Address Book Toolbar"]');
    I.seeElement('.classic-toolbar[aria-label="Address Book Toolbar"]');
    I.logout();
});

Scenario('[C7346] Launch "Calendar" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Calendar', '.launcher-dropdown');
    I.waitForElement('.classic-toolbar[aria-label="Calendar Toolbar"]');
    I.seeElement('.classic-toolbar[aria-label="Calendar Toolbar"]');
    I.logout();
});

Scenario('[C7347] Launch "Drive" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Drive', '.launcher-dropdown');
    I.waitForElement('.classic-toolbar[aria-label="Drive Toolbar"]');
    I.seeElement('.classic-toolbar[aria-label="Drive Toolbar"]');
    I.logout();
});

Scenario('[C7350] Launch "Settings" application', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForElement('.contact-picture');
    I.click('.contact-picture');
    I.waitForElement('#topbar-settings-dropdown');
    I.click('Settings', '#topbar-settings-dropdown');
    I.waitForElement('.settings-detail-pane');
    I.seeElement('.settings-detail-pane');
    I.logout();
});
