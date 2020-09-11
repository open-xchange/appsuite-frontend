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
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');

    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Portal');
    I.waitForElement('.greeting-phrase');
});

Scenario('[C7344] Launch "E-Mail" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Mail', '.launcher-dropdown');
    I.waitForText('Compose');
});

Scenario('[C7345] Launch "Address Book" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Address Book', '.launcher-dropdown');
    I.waitForElement('.classic-toolbar[aria-label="Address Book toolbar. Use cursor keys to navigate."]');
    I.seeElement('.classic-toolbar[aria-label="Address Book toolbar. Use cursor keys to navigate."]');
});

Scenario('[C7346] Launch "Calendar" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Calendar', '.launcher-dropdown');
    I.waitForElement('.classic-toolbar[aria-label="Calendar toolbar. Use cursor keys to navigate."]');
    I.seeElement('.classic-toolbar[aria-label="Calendar toolbar. Use cursor keys to navigate."]');
});

Scenario('[C7347] Launch "Drive" application', async function (I) {
    I.login('app=io.ox/portal');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Drive', '.launcher-dropdown');
    I.waitForText('My files');
});

Scenario('[C7350] Launch "Settings" application', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.waitForElement('#io-ox-topbar-settings-dropdown-icon');
    I.click('~Settings', '#io-ox-topbar-settings-dropdown-icon');
    I.waitForVisible('#topbar-settings-dropdown');
    I.click('Settings', '#topbar-settings-dropdown');
    I.waitForElement('.settings-detail-pane');
    I.seeElement('.settings-detail-pane');
});

Scenario('[C7351] Trigger refresh', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.click('#io-ox-refresh-icon');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
});

Scenario('[C234516] Launch "Tasks" application', async function (I) {
    I.login('app=io.ox/mail');
    I.waitForElement('.fa-spin.fa-refresh');
    I.waitForElement('.fa-spin-paused.fa-refresh');
    I.waitForElement('#io-ox-launcher');
    I.click('#io-ox-launcher');
    I.waitForElement('.launcher-dropdown');
    I.click('Tasks', '.launcher-dropdown');
    I.waitForElement('.classic-toolbar[aria-label="Tasks toolbar. Use cursor keys to navigate."]');
    I.seeElement('.classic-toolbar[aria-label="Tasks toolbar. Use cursor keys to navigate."]');
});
