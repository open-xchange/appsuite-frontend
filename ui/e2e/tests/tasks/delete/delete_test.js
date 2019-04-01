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

Feature('Tasks > Delete');

Before(async (users) => {
    await users.create();
    await users.create();
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7753] Delete single Task', async function (I, users) {
    let testrailID = 'C7753';
    let testrailName = 'Delete single Task';
    const taskDefaultFolder = await I.grabDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        status: '1',
        percent_completed: '0',
        folder_id: taskDefaultFolder,
        recurrence_type: '0',
        full_time: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        notification: true,
        note: testrailName
    };
    I.haveTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForText(testrailID, 5, '.window-body');
    I.waitForText(testrailID, 5, '.tasks-detailview .title');
    I.clickToolbar('Delete');
    I.waitForElement('.io-ox-dialog-wrapper [role="dialog"]', 5);
    I.waitForText('Do you really want to delete this task?', 5, '.io-ox-dialog-wrapper');
    I.click('Delete', '.io-ox-dialog-wrapper');
    I.waitForDetached('.io-ox-dialog-wrapper [role="dialog"]', 5);
    I.waitForText('No elements selected', 5, '.task-detail-container .summary.empty');
    I.waitForText('Empty', 5, '[aria-label="Task list"] .io-ox-fail');
    I.logout();
});
Scenario('[C7754] Delete several Task at the same time', async function (I, users) {
    let testrailID = 'C7754';
    let testrailName = 'Delete several Task at the same time';
    const taskDefaultFolder = await I.grabDefaultFolder('tasks', { user: users[0] });
    let numberOfTasks = 3;
    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        var task = {
            title: id,
            folder_id: taskDefaultFolder,
            note: testrailName
        };
        I.haveTask(task, { user: users[0] });
    }
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.click('[aria-label="Tasks toolbar"] .btn[title="Select all"]');
    I.seeNumberOfElements('li.selected.vgrid-cell', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');
    I.clickToolbar('Delete');
    I.waitForElement('.io-ox-dialog-wrapper [role="dialog"]', 5);
    I.waitForText('Do you really want to delete these tasks?', 5, '.io-ox-dialog-wrapper');
    I.click('Delete', '.io-ox-dialog-wrapper');
    I.waitForDetached('.io-ox-dialog-wrapper [role="dialog"]', 5);
    I.waitForText('No elements selected', 5, '.task-detail-container .summary.empty');
    I.waitForText('Empty', 5, '[aria-label="Task list"] .io-ox-fail');
    I.logout();
});
Scenario('[C7755] Delete recurring Task', async function (I, users) {
    let testrailID = 'C7755';
    let testrailName = 'Delete recurring Task';
    const taskDefaultFolder = await I.grabDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        note: testrailName,
        status: '1',
        percent_completed: '0',
        folder_id: taskDefaultFolder,
        recurrence_type: 2,
        full_time: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        notification: true,
        start_time: 1551657600000,
        end_time: 1551744000000,
        interval: 1,
        days: 2
    };
    I.haveTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.clickToolbar('Delete');
    I.waitForElement('.io-ox-dialog-wrapper [role="dialog"]', 5);
    I.waitForText('Do you really want to delete this task?', 5, '.io-ox-dialog-wrapper');
    I.click('Delete', '.io-ox-dialog-wrapper');
    I.waitForDetached('.io-ox-dialog-wrapper [role="dialog"]', 5);
    I.waitForText('No elements selected', 5, '.task-detail-container .summary.empty');
    I.waitForText('Empty', 5, '[aria-label="Task list"] .io-ox-fail');
    I.logout();
});
