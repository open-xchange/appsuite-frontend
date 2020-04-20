/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Benedikt Kroening <benedikt.kroening@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('General > Inline help');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C274424] Inline Help', async (I) => {
    I.login();
    verifyHelp(I, 'Mail', 'The E-Mail Components');
    verifyHelp(I, 'Calendar', 'The Calendar Components');
    verifyHelp(I, 'Address Book', 'The Address Book Components');
    verifyHelp(I, 'Drive', 'The Drive Components');
    verifyHelp(I, 'Tasks', 'The Tasks Components');
    verifyHelp(I, 'Portal', 'The Portal Components');
});

function verifyHelp(I, appName, expectedTitle) {
    I.openApp(appName);

    // wait until current app is correct
    I.waitForFunction(function (appName) {
        let app = ox.ui.App.getCurrentFloatingApp() || ox.ui.App.getCurrentApp();
        return app && app.get ? app.get('title') === appName : false;
    }, [appName], 5);

    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window.floating-window .inline-help-iframe');
    within({ frame: '.io-ox-help-window.floating-window .inline-help-iframe' }, () => {
        I.waitForText('Table Of Contents');
        I.see(expectedTitle, '.title');
        I.click('Table Of Contents');
        I.waitForText('User Guide');
    });
    I.click('.floating-window [data-action="close"]');
}
