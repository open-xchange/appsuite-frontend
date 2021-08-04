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

Feature('Tasks');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('check actions', async function ({ I, tasks, dialogs }) {
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();
    I.fillField('Subject', 'Test Task');
    I.click('Expand form');
    I.fillField({ css: '[data-attribute="start_time"] .datepicker-day-field' }, '12/13/2114');
    I.fillField({ css: '[data-attribute="end_time"] .datepicker-day-field' }, '12/13/2114');
    tasks.create();

    // test done undone actions
    I.waitForVisible('.badge-notstarted');

    I.clickToolbar('Done');
    I.waitForVisible('.badge-done');
    // close yell
    I.pressKey('Escape');

    I.clickToolbar('Undone');
    I.waitForVisible('.badge-notstarted');
    // close yell
    I.pressKey('Escape');

    tasks.editTask();
    I.fillField('Description', 'Best Task evor!!!11elf');
    tasks.save();

    I.waitForText('Best Task evor!!!11elf', 5, '.tasks-detailview');
    I.clickToolbar('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForVisible('.summary.empty');
    I.waitForDetached('.modal-dialog');
});

Scenario('[XSS] [OXUIB-401] No malicious code execution in mail reminders', async function ({ I, tasks }) {
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();
    I.fillField('Subject', 'Test Task');
    I.fillField('Description', 'mail://hello"onmouseover=document.title=1337;"@example.com');
    tasks.create();

    I.waitForVisible('.tasks-detailview');
    // allows alerts, would be closed directly otherwise
    I.amAcceptingPopups();
    I.moveCursorTo('.ox-internal-mail-link');
    I.dontSeeInTitle('1337');
});
