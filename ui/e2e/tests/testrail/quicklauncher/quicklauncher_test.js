/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('testrail - quicklauncher');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('OXUI-642', function (I, users) {
    I.haveSetting('io.ox/core//apps/quickLaunchCount', 5)
    I.haveSetting('io.ox/core//apps/quickLauncherLimit', 5)
    I.haveSetting('io.ox/core//apps/quickLaunch', 'io.ox/mail/main,io.ox/calendar/main,io.ox/contacts/main,io.ox/portal/main,io.ox/files/main')
    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    //TODO verify order 
    I.seeElement('#io-ox-quicklaunch button[data-app-name="io.ox/mail"]')
    I.seeElement('#io-ox-quicklaunch button[data-app-name="io.ox/calendar"]')
    I.seeElement('#io-ox-quicklaunch button[data-app-name="io.ox/contacts"]')
    I.seeElement('#io-ox-quicklaunch button[data-app-name="io.ox/portal"]')
    I.seeElement('#io-ox-quicklaunch button[data-app-name="io.ox/files"]')
    I.seeElement('.settings-container [name="apps/quickLaunch0"] [value="io.ox/mail/main"]')
    I.seeElement('.settings-container [name="apps/quickLaunch1"] [value="io.ox/calendar/main"]')
    I.seeElement('.settings-container [name="apps/quickLaunch2"] [value="io.ox/contacts/main"]')
    I.seeElement('.settings-container [name="apps/quickLaunch3"] [value="io.ox/portal/main"]')
    I.seeElement('.settings-container [name="apps/quickLaunch4"] [value="io.ox/files/main"]')
    I.logout()
});