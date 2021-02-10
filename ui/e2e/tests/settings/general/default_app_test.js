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

Scenario('[C7761] Define default app after login', async ({ I }) => {

    // Calendar
    await I.haveSetting({ 'io.ox/core': { autoStart: 'io.ox/calendar/main' } });
    I.login();
    I.waitForText('Scheduling');
    I.waitForText('Today');
    I.logout();

    // Mail
    await I.haveSetting({ 'io.ox/core': { autoStart: 'io.ox/mail/main' } });
    I.login();
    I.waitForText('Compose');
    I.waitForText('No message selected');
    I.logout();

    // None
    await I.haveSetting({ 'io.ox/core': { autoStart: 'none' } });
    I.login();
    I.waitForInvisible('#background-loader');
    I.dontSeeElement('.window-container');
});
