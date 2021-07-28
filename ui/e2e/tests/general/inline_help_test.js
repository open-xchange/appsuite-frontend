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

Feature('General > Inline help');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// TODO: shaky at verifyHelp() -> within(), probably a puppeteer bug
// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario.skip('[C274424] Inline Help', async ({ I }) => {
    I.login();
    verifyHelp(I, 'Mail', 'The E-Mail Components');
    verifyHelp(I, 'Calendar', 'The Calendar Components');
    verifyHelp(I, 'Address Book', 'The Address Book Components');
    verifyHelp(I, 'Drive', 'The Drive Components');
    verifyHelp(I, 'Tasks', 'The Tasks Components');
    verifyHelp(I, 'Portal', 'The Portal Components');
});

function verifyHelp(I, appName, expectedHelp, topbar) {
    I.openApp(appName);

    // wait until current app is correct
    I.waitForFunction(function (appName) {
        let app = ox.ui.App.getCurrentFloatingApp() || ox.ui.App.getCurrentApp();
        return app && app.get ? app.get('title') === appName : false;
    }, [appName], 5);

    topbar.help();
    // TODO: broken, sometimes fails at I.waitForText('User Guide') -> "cannot read property 'innerText' of null"
    within({ frame: '.io-ox-help-window.floating-window .inline-help-iframe' }, () => {
        I.see(expectedHelp, '.title');
        I.waitForText('Table Of Contents');
        I.click('Table Of Contents');
        I.waitForText('User Guide');
    });
    I.click('.floating-window [data-action="close"]');
}
