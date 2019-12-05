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

Feature('General > Floating windows');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C237267] Check if specific apps open as floating windows @contentReview', function (I) {
    I.login(['app=io.ox/tasks']);
    I.waitForVisible('.io-ox-tasks-window');

    I.clickToolbar('New task');
    I.waitForVisible('.floating-window');

    within('.floating-window', async () => {
        I.click({ css: '[data-action=close]' });
    });
});

Scenario('[C237269] Toggle display styles of floating windows @contentReview', function (I) {
    I.login(['app=io.ox/tasks']);
    I.waitForVisible('.io-ox-tasks-window');

    I.clickToolbar('New task');
    I.waitForVisible('.floating-window');

    I.click({ css: '[data-action=maximize]' });
    I.waitForVisible('.floating-window.maximized');

    I.click({ css: '[data-action=normalize]' });
    I.waitForVisible('.floating-window.normal');

    I.click({ css: '[data-action=minimize]' });
    I.wait(1);
    I.dontSeeElement('.floating-window');
    I.waitForVisible({ css: '[data-action=restore]' });
});
