/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7874] Set notification for new/modified/deleted', async function ({ I, users, tasks, dialogs }) {
    await users[0].hasConfig('com.openexchange.event.isEventQueueEnabled', 'false');
    await users[1].hasConfig('com.openexchange.event.isEventQueueEnabled', 'false');
    await users[0].hasConfig('com.openexchange.event.eventQueueDelay', 0);
    await users[1].hasConfig('com.openexchange.event.eventQueueDelay', 0);

    function createTask(subject) {
        tasks.newTask();

        I.waitForElement('.io-ox-tasks-edit');
        within('.io-ox-tasks-edit', () => {
            I.waitForElement({ css: 'input.title-field' });
            I.fillField('Subject', subject);
            I.fillField('Description', 'do something very important');
            I.click('Expand form');
            I.click('~Select contacts');
        });
        I.waitForElement('.modal-dialog');
        within('.modal-dialog', () => {
            I.waitForFocus('.search-field');
            I.fillField('Search', users[0].userdata.sur_name);
            I.waitForText(users[0].userdata.sur_name, 5, '.last_name');
            I.click(users[0].userdata.sur_name, '.last_name');
            I.waitForElement('.list-item.token');
            dialogs.clickButton('Select');
        });
        I.waitForText(users[0].userdata.sur_name, '.io-ox-tasks-edit .participantsrow');
        tasks.create();
    }

    function editTask(subject) {
        I.waitForText('Edit', 5, '.classic-toolbar');
        I.retry(5).click('Edit', '.classic-toolbar');
        I.waitForElement('.io-ox-tasks-edit');
        within('.io-ox-tasks-edit', () => {
            I.waitForElement({ css: 'input.title-field' });
            I.fillField('Subject', `${subject} edited`);
            I.fillField('Description', 'do something else');
        });
        tasks.save();
    }

    function deleteTask() {
        I.clickToolbar('Delete');
        dialogs.clickButton('Delete');
    }

    session('Alice', () => {
        I.login('app=io.ox/settings');
        I.waitForElement('~Tasks', '.tree-container');
        I.click('~Tasks', '.tree-container');
        I.waitForElement('.checkbox');
        I.retry(5).seeCheckboxIsChecked('notifyNewModifiedDeleted');
    });

    session('Bob', () => {
        I.login('app=io.ox/tasks', { user: users[1] });
        tasks.waitForApp();
        createTask('task 1');
    });

    session('Alice', () => {
        I.openApp('Mail');
        I.waitForText('New task: task 1', 5, '.list-view.visible-selection');
    });

    session('Bob', () => {
        editTask('task 1');
    });

    session('Alice', async () => {
        I.openApp('Mail');

        let retries = 60;
        let element = await I.grabNumberOfVisibleElements('.list-item.selectable.unread');
        while (element < 2 && retries) {
            I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
            I.click('.taskbar #io-ox-refresh-icon');
            I.waitForElement('.launcher .fa-spin-paused', 5);
            I.wait(1);
            element = await I.grabNumberOfVisibleElements('.list-item.selectable.unread');
            retries -= 1;
        }
        I.waitForText('Task changed: task 1', 5, '.list-view.visible-selection');
    });

    session('Bob', () => {
        deleteTask();
    });

    session('Alice', async () => {
        I.openApp('Mail');

        let retries = 60;
        let element = await I.grabNumberOfVisibleElements('.list-item.selectable.unread');
        while (element < 3 && retries) {
            I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
            I.click('.taskbar #io-ox-refresh-icon');
            I.waitForElement('.launcher .fa-spin-paused', 5);
            I.wait(1);
            element = await I.grabNumberOfVisibleElements('.list-item.selectable.unread');
            retries -= 1;
        }
        I.waitForText('Task deleted: task 1 edited', 5, '.list-view.visible-selection');

        I.openApp('Settings');
        I.uncheckOption('notifyNewModifiedDeleted');
        I.retry(5).dontSeeCheckboxIsChecked('notifyNewModifiedDeleted');
    });

    session('Bob', () => {
        createTask('task 2');
        I.waitForNetworkTraffic();
        editTask('task 2');
        I.waitForNetworkTraffic();
        deleteTask();
    });

    session('Alice', () => {
        I.triggerRefresh();
        I.dontSee('New task: task 2', '.list-view.visible-selection');
        I.dontSee('Task changed: task 2', '.list-view.visible-selection');
        I.dontSee('Task deleted: task 2 edited', '.list-view.visible-selection');
    });
});
