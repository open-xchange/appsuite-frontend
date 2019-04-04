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
