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
