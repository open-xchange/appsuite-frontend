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

Feature('Tasks > Edit');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create(),
        users.create()
    ]);
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7738] Edit task with all fields filled', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7738',
        testrailName = 'Edit task with all fields filled';

    await I.haveTask({
        title: testrailID,
        status: '1',
        percent_completed: '0',
        folder_id: await I.grabDefaultFolder('tasks'),
        recurrence_type: '0',
        full_time: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        notification: true,
        target_duration: '1337',
        actual_duration: '1336',
        target_costs: '1335',
        actual_costs: '1334',
        trip_meter: '1337mm',
        billing_information: 'Don not know any Bill',
        companies: 'Open-Xchange GmbH',
        note: testrailName,
        currency: 'EUR'
    });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.task-details');
    within('.task-details', () => {
        I.see('Estimated duration in minutes');
        I.see('1337');
        I.see('Actual duration in minutes');
        I.see('1336');
        I.see('Estimated costs');
        I.see('€1,335');
        I.see('Actual costs');
        I.see('€1,334');
        I.see('Distance');
        I.see('1337mm');
        I.see('Billing information');
        I.see('Don not know any Bill');
        I.see('Companies');
        I.see('Open-Xchange GmbH');
    });

    tasks.editTask();
    I.fillField('Estimated duration in minutes', '1339');
    I.fillField('Actual duration in minutes', '1338');
    I.fillField('Estimated costs', '1339');
    I.fillField('Actual costs', '1338');
    I.selectOption('Currency', 'RUB');
    I.fillField('Distance', '1338mm');
    I.fillField('Billing information', 'Yes, i know any Bill');
    I.fillField('Companies', 'Open-Xchange Inc.');
    tasks.save();

    I.waitForElement('.task-details');
    within('.task-details', () => {
        I.waitForInvisible('//dd[text()="1337"]');
        I.waitForInvisible('//dd[text()="1336"]');
        I.waitForInvisible('//dd[text()="€1,335"]');
        I.waitForInvisible('//dd[text()="€1,334"]');
        I.waitForInvisible('//dd[text()="1337mm"]');
        I.waitForInvisible('//dd[text()="Don not know any Bill"]');
        I.waitForInvisible('//dd[text()="Open-Xchange GmbH"]');
    });
    I.waitForText('1339', '.task-details');
    I.waitForText('1338', '.task-details');
    I.waitForText('RUB', '.task-details');
    I.waitForText('1,339.00', '.task-details');
    I.waitForText('1,338.00', '.task-details');
    I.waitForText('1338mm', '.task-details');
    I.waitForText('Yes, i know any Bill', '.task-details');
    I.waitForText('Open-Xchange Inc.', '.task-details');
});

Scenario('[C7739] Change tasks due date in dropdown', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const moment = require('moment');

    await I.haveTask({ title: 'C7739', folder_id: await I.grabDefaultFolder('tasks'), note: 'Change tasks due date in dropdown' });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview');

    ['tomorrow', 2, 3, 4, 5, 6, 'in one week'].forEach(function (day, i) {
        I.clickToolbar('Due');
        I.waitForElement('.dropdown.open .dropdown-menu');
        if (i === 0) I.clickToolbar(day);
        else if (i === 6) I.clickToolbar(day);
        else I.clickToolbar(moment().add(i + 1, 'days').format('dddd'));
        I.waitForText('Due ' + moment().add(i + 1, 'days').format('M/D/YYYY'), 5, '.tasks-detailview .end-date');
        I.waitForText(moment().add(i + 1, 'days').format('M/D/YYYY'), 5, '.vgrid .end_date');
        I.waitForDetached('.io-ox-alert');
    });
});

Scenario('[C7740] Edit Task', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7740';
    await I.haveTask({ title: testrailID, folder_id: await I.grabDefaultFolder('tasks'), note: 'Edit Task' });
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.editTask();
    I.fillField('Subject', testrailID + ' - 2');
    I.waitForText(testrailID + ' - 2', 5, '.floating-window-content .title');
    tasks.save();
    I.waitForText(testrailID + ' - 2', 5, '.tasks-detailview .title');
    I.waitForText(testrailID + ' - 2', 5, '[role="navigation"] .title');
});

Scenario('[C7741] Mark Task as Done', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveTask({ title: 'C7741', folder_id: await I.grabDefaultFolder('tasks'), note: 'Mark Task as Done' });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview', 5);
    I.clickToolbar('Done');
    I.waitForText('Done', 5, '[aria-label="Task list"] .status.badge-done');
    I.waitForText('Progress 100 %', 5, '.tasks-detailview .task-progress');
    I.waitForText('Done', 5, '.tasks-detailview .badge-done.state');
    I.waitForText('Date completed', 5);
});

Scenario('[C7742] Mark Task as Undone', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveTask({
        title: 'C7742',
        folder_id: await I.grabDefaultFolder('tasks'),
        note: 'Mark Task as Undone',
        percent_completed: 100,
        status: 3
    });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview', 5);
    I.clickToolbar('Undone');
    I.waitForText('Not started', 5, { css: '[aria-label="Task list"] .status.badge-notstarted' });
    I.dontSee('Progress 100 %');
    I.waitForText('Not started', 5, '.tasks-detailview .badge-notstarted');
});

Scenario('[C7743] Move single Task', async function ({ I, tasks }, dialogs) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7743',
        testrailName = 'Move single Task',
        taskDefaultFolder = await I.grabDefaultFolder('tasks');

    await Promise.all([
        I.haveFolder({ module: 'tasks', title: testrailID, parent: taskDefaultFolder }),
        I.haveTask({ title: testrailID, folder_id: taskDefaultFolder, note: testrailName })
    ]);

    I.login('app=io.ox/tasks');
    tasks.waitForApp();

    I.clickToolbar('~More actions');
    I.click('Move');
    dialogs.waitForVisible();
    I.waitForText('Move', 5, dialogs.locators.header);
    I.waitForElement('.modal .section .folder-arrow');
    I.click('.modal .section .folder-arrow');
    I.waitForElement(`.modal .section.open [aria-label="${testrailID}"]`, 5);
    I.click(`.modal [aria-label="${testrailID}"]`);
    I.waitForEnabled('.modal button.btn-primary');
    dialogs.clickButton('Move');
    I.waitForElement('.launcher-icon.fa-refresh.fa-spin');
    I.waitForDetached('.launcher-icon.fa-refresh.fa-spin');
    I.selectFolder(testrailID);
    I.waitForElement(locate('.vgrid-cell').withText(testrailID));
    I.click(locate('.vgrid-cell').withText(testrailID));
    I.waitForText(testrailID, 5, '.tasks-detailview .title');
    I.waitForText(testrailID, 5, '[role="navigation"] .title');
});

Scenario('[C7744] Mark several task as done at the same time', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7744',
        testrailName = 'Mark several task as done at the same time',
        numberOfTasks = 3,
        folder_id = await I.grabDefaultFolder('tasks'),
        promises = [];

    for (let i = 1; i <= numberOfTasks; i++) {
        promises.push(I.haveTask({ title: `${testrailID} - ${i}`, folder_id: folder_id, note: testrailName }));
    }
    await Promise.all(promises);

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview', 5);
    I.click('[aria-label="Tasks toolbar"] .btn[title="Select all"]');
    I.seeNumberOfElements('li.selected.vgrid-cell', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');
    I.clickToolbar('Done');
    I.retry(5).seeNumberOfElements('[aria-label="Task list"][role="navigation"] .badge-done.status', numberOfTasks);
    for (let i = 1; i <= numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        I.click('[role="navigation"][aria-label="Task list"] [aria-label="' + id + ', Done."]');
        I.waitForElement('[role="navigation"][aria-label="Task list"] [aria-label="' + id + ', Done."].selected', 5);
        I.waitForElement('.tasks-detailview', 5);
        I.waitForText(id, 5, '.tasks-detailview .title');
        I.waitForText('Progress 100 %', 5, '.tasks-detailview .task-progress');
        I.waitForText('Done', 5, '.tasks-detailview .badge-done.state');
        I.waitForText('Date completed', 5);
    }
});

Scenario('[C7745] Mark several Task as Undone at the same time', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7745',
        testrailName = 'Mark several Task as Undone at the same time',
        taskDefaultFolder = await I.grabDefaultFolder('tasks'),
        numberOfTasks = 3,
        promises = [];

    for (let i = 1; i <= numberOfTasks; i++) {
        promises.push(I.haveTask({
            title: `${testrailID} - ${i}`,
            folder_id: taskDefaultFolder,
            note: testrailName,
            percent_completed: 100,
            status: 3
        }));
    }
    await Promise.all(promises);

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview', 5);
    I.click('[aria-label="Tasks toolbar"] .btn[title="Select all"]');
    I.seeNumberOfElements('li.selected.vgrid-cell', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');
    I.clickToolbar('Undone');
    I.retry(5).seeNumberOfElements('[aria-label="Task list"][role="navigation"] .badge-notstarted.status', numberOfTasks);
    for (let i = 1; i <= numberOfTasks; i++) {
        const id = testrailID + ' - ' + i;
        I.click('[role="navigation"][aria-label="Task list"] [aria-label="' + id + ', Not started."]');
        I.waitForElement('[role="navigation"][aria-label="Task list"] [aria-label="' + id + ', Not started."].selected', 5);
        I.waitForElement('.tasks-detailview', 5);
        I.waitForText('Not started', 5, '.tasks-detailview .badge-notstarted');
        I.waitForText(id, 5, '.tasks-detailview .title');
    }
});

Scenario('[C7746] Move several tasks to an other folder at the same time', async function ({ I, tasks }, dialogs) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7746',
        testrailName = 'Move several tasks to an other folder at the same time',
        numberOfTasks = 3,
        taskDefaultFolder = await I.grabDefaultFolder('tasks'),
        promises = [
            I.haveFolder({ module: 'tasks', title: testrailID, parent: taskDefaultFolder })
        ];

    for (let i = 1; i <= numberOfTasks; i++) {
        promises.push(
            I.haveTask({ title: `${testrailID} - ${i}`, folder_id: taskDefaultFolder, note: testrailName })
        );
    }
    await Promise.all(promises);

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.vgrid-cell.selected.tasks');
    I.waitForElement('.tasks-detailview');
    I.click('.select-all');
    I.seeNumberOfElements('.vgrid-cell.selected', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');

    I.clickToolbar('~More actions');
    I.clickDropdown('Move');
    dialogs.waitForVisible();
    I.waitForText('Move', 5, dialogs.locators.header);
    I.waitForElement('.modal .section .folder-arrow');
    I.click('.modal .section .folder-arrow');
    I.waitForElement(`.modal .section.open [aria-label="${testrailID}"]`, 5);
    I.click(`.modal [aria-label="${testrailID}"]`);
    I.waitForEnabled('.modal button.btn-primary');
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');
    I.triggerRefresh();
    I.selectFolder(testrailID);
    tasks.waitForApp();
    I.waitForElement('.vgrid-cell.selected.tasks');
    I.waitForElement('.tasks-detailview');
    for (let i = 1; i <= numberOfTasks; i++) {
        const id = `${testrailID} - ${i}`;
        I.see(id, '.vgrid-cell');
        tasks.selectTask(id);
        I.waitForText(id, 2, '.tasks-detailview');
    }
});

Scenario('[C7747] Add an attachment to a Task', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7747',
        testrailName = 'Add an attachment to a Task';
    await I.haveTask({ title: testrailID, folder_id: await I.grabDefaultFolder('tasks'), note: testrailName });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview', 5);
    tasks.editTask();
    I.click('Expand form');

    I.attachFile('[data-app-name="io.ox/tasks/edit"] input[type="file"]', 'e2e/media/files/generic/testdocument.odt');
    I.waitForElement('.file.io-ox-core-tk-attachment', 5);
    I.seeNumberOfElements('.file.io-ox-core-tk-attachment', 1);
    tasks.save();
    I.waitForText(testrailID, 10, '.tasks-detailview .title');
    I.waitForText('Attachments', 10, '.tasks-detailview .attachments');
    I.waitForText('testdocument.odt', 10, '.tasks-detailview [data-dropdown="io.ox/core/tk/attachment/links"]');
});

Scenario('[C7748] Remove an attachment from a Task', async function ({ I, tasks }) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7748',
        testrailName = 'Remove an attachment from a Task',
        taskDefaultFolder = await I.grabDefaultFolder('tasks'),
        task = await I.haveTask({ title: testrailID, folder_id: taskDefaultFolder, note: testrailName });
    await I.haveAttachment('tasks', { id: task.id, folder: taskDefaultFolder }, 'e2e/media/files/generic/testdocument.odt');

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForElement('.tasks-detailview', 5);
    I.waitForText(testrailID, 10, '.tasks-detailview .title');
    I.waitForText('Attachments', 10, '.tasks-detailview .attachments');
    I.waitForText('testdocument.odt', 10, '.tasks-detailview [data-dropdown="io.ox/core/tk/attachment/links"]');
    tasks.editTask();
    I.waitForElement('.file.io-ox-core-tk-attachment', 5);
    I.seeNumberOfElements('.file.io-ox-core-tk-attachment', 1);
    I.click('.io-ox-core-tk-attachment-list .remove');
    I.waitForDetached('.file.io-ox-core-tk-attachment', 5);
    I.seeNumberOfElements('.file.io-ox-core-tk-attachment', 0);
    tasks.save();
    I.waitForText(testrailID, 10, '.tasks-detailview .title');
    I.waitForDetached('.tasks-detailview .attachments-container', 30);
});

Scenario('[C7749] Edit existing Task as participant', async function ({ I, users }, tasks) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7749',
        testrailName = 'Edit existing Task as participant';
    await I.haveTask({
        title: testrailID,
        status: '1',
        percent_completed: '0',
        folder_id: await I.grabDefaultFolder('tasks'),
        recurrence_type: '0',
        full_time: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        notification: true,
        note: testrailName,
        participants: [{ id: users[1].userdata.id, type: 1 }]
    });

    I.login('app=io.ox/tasks', { user: users[1] });
    tasks.waitForApp();
    I.waitForText(testrailID, 5, '.window-body');
    I.waitForText(testrailID, 5, '.tasks-detailview .title');
    tasks.editTask();
    I.fillField('Subject', testrailID + ' - 2');
    I.fillField('Description', testrailName + ' - 2');
    tasks.save();
    I.waitForText(testrailID + ' - 2', 5, '.window-body');
    I.waitForText(testrailID + ' - 2', 5, '.tasks-detailview .title');
    I.logout();

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.waitForText(testrailID + ' - 2', 5, '.window-body');
    I.waitForText(testrailID + ' - 2', 5, '.tasks-detailview .title');
});

Scenario('[C7750] Edit existing Task in a shared folder', async function ({ I, users }, tasks) {
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    const testrailID = 'C7750',
        testrailName = 'Edit existing Task in a shared folder',
        folder_id = await I.haveFolder({
            module: 'tasks',
            subscribed: 1,
            title: testrailID,
            permissions: [
                { bits: 403710016, entity: users[0].userdata.id, group: false },
                { user: users[1], access: 'author' }
            ],
            parent: await I.grabDefaultFolder('tasks')
        });

    await I.haveTask({
        title: testrailID,
        status: '1',
        percent_completed: '0',
        folder_id,
        recurrence_type: '0',
        full_time: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        notification: true,
        note: testrailName
    });

    function waitAndCheck(id, text) {
        text = text ? id + text : id;
        I.waitForText('My tasks');
        I.selectFolder(id);
        I.waitForText(testrailID, undefined, '.tasks.even');
        I.click('.tasks.even[data-index="0"]');
        I.waitForText(text, 15, '.window-body');
        I.waitForText(text, 15, '.tasks-detailview .title');
    }

    I.login('app=io.ox/tasks', { user: users[1] });
    tasks.waitForApp();
    waitAndCheck(testrailID);
    tasks.editTask();
    I.waitForElement('.floating-window-content .container.io-ox-tasks-edit', 5);
    I.fillField('Subject', testrailID + ' - 2');
    I.fillField('Description', testrailName + ' - 2');
    tasks.save();
    waitAndCheck(testrailID, ' - 2');
    I.logout();

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    waitAndCheck(testrailID, ' - 2');
});

Scenario('[C7751] Close Task with the X', function ({ I, tasks }) {
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    I.clickToolbar('New task');
    I.waitForVisible('.io-ox-tasks-edit-window');
    I.see('Create');
    I.see('Discard');
    I.click('~Close', '.io-ox-tasks-edit-window');
    I.waitForDetached('.io-ox-tasks-edit-window');
});

Scenario('[C7752] Close Task with the X after adding some information', function ({ I, tasks }) {
    const testrailID = 'C7752',
        testrailName = 'Close Task with the X after adding some information';
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);
    I.click('Discard');
    I.waitForText('Do you really want to discard your changes?');
    I.click('Cancel');
    I.click('~Close', '.io-ox-tasks-edit-window');
    I.waitForText('Do you really want to discard your changes?');
    I.click('Cancel');
    I.click('~Close', '.io-ox-tasks-edit-window');
    I.waitForText('Do you really want to discard your changes?');
    I.click('Discard changes');
    I.waitForDetached('.io-ox-tasks-edit-window');
});
