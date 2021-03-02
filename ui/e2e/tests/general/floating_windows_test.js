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

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C237267] Check if specific apps open as floating windows @contentReview', function ({ I }) {
    I.login(['app=io.ox/tasks']);
    I.waitForVisible('.io-ox-tasks-window');

    I.clickToolbar('New task');
    I.waitForVisible('.floating-window');

    within('.floating-window', async () => {
        I.click({ css: '[data-action=close]' });
    });
});

Scenario('[C237268] Open floating apps and verify the taskbar', function ({ I, mail, tasks }) {
    I.login(['app=io.ox/mail']);
    mail.waitForApp();

    mail.newMail();
    I.dontSeeElement('#io-ox-taskbar-container');
    I.openApp('Address Book');
    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.seeElement('.io-ox-mail-compose-window');
    I.openApp('Tasks');
    tasks.newTask();
    I.seeElement('.io-ox-mail-compose');
    I.seeElement('.io-ox-contacts-edit-window');
    I.click('~Minimize', '.io-ox-mail-compose-window');
    I.waitForVisible('#io-ox-taskbar-container');
    I.waitForVisible('#io-ox-taskbar-container button[aria-label="Compose"]');
});

Scenario('[C237269] Toggle display styles of floating windows @contentReview', function ({ I }) {
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
