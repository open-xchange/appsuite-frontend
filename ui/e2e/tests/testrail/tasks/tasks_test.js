/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */


Feature('testrail - tasks').tag('6');

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7727] Create task with all fields', async function (I) {
    let testrailID = 'C7727';
    let testrailName = 'Create task with all fields';
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);

    I.click('Expand form');

    I.click('All day');
    I.fillField({ css: '[data-attribute="start_time"] .datepicker-day-field' }, '12/13/2114');
    I.click({ css: '[data-attribute="start_time"] .time-field' });
    I.fillField({ css: '[data-attribute="start_time"] .time-field' }, '12:00 PM');

    I.fillField({ css: '[data-attribute="end_time"] .datepicker-day-field' }, '12/13/2114');
    I.click({ css: '[data-attribute="end_time"] .time-field' });
    I.fillField({ css: '[data-attribute="end_time"] .time-field' }, '1:00 PM');

    I.selectOption('Reminder', 'in one week');
    I.selectOption('Status', 'In progress');
    I.selectOption('Priority', 'High');

    I.fillField('.tt-input', 'testdude1@test.test');

    I.click('Show details');

    I.fillField({ css: '[name="target_duration"]' }, '25');
    I.fillField({ css: '[name="actual_duration"]' }, '45');
    I.fillField({ css: '[name="target_costs"]' }, '27');
    I.fillField({ css: '[name="actual_costs"]' }, '1337');
    I.selectOption({ css: '[name="currency"]' }, 'EUR');
    I.fillField({ css: '[name="trip_meter"]' }, '1337mm');
    I.fillField({ css: '[name="billing_information"]' }, "Don't know any Bill");
    I.fillField({ css: '[name="companies"]' }, 'Wurst Inc.');

    I.click('Create');

    I.seeElement('.tasks-detailview');

    I.seeElement({ css: '[title="High priority"]' });
    I.see(testrailID);
    I.see(testrailName);

    I.see('Due 12/13/2114, 1:00 PM');
    I.see('Progress 25 %');
    I.see('In progress');

    I.see('Start date');
    I.see('12/13/2114, 12:00 PM');

    I.see('Estimated duration in minutes');
    I.see('25');
    I.see('Actual duration in minutes');
    I.see('45');
    I.see('Estimated costs');
    I.see('27 EUR');
    I.see('Actual costs');
    I.see('1337 EUR');
    I.see('Distance');
    I.see('1337mm');
    I.see('Billing information');
    I.see("Don't know any Bill");
    I.see('Companies');
    I.see('Wurst Inc.');

    I.see('External participants');
    I.see('testdude1 <testdude1@test.test>');

    I.logout();
});
Scenario('[C7728] Create simple Task', async function (I) {
    let testrailID = 'C7728';
    let testrailName = 'Create simple Task';
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);

    I.click('Create');

    I.seeElement('.tasks-detailview');

    I.see(testrailID);
    I.see(testrailName);
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');

    I.logout();
});
Scenario('[C7729] Create Task with participants', async function (I, users) {
    let testrailID = 'C7729';
    let testrailName = 'Create Task with participants';

    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);

    I.click('Expand form');
    I.fillField('Add contact', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    //I.waitForElement({ css: '[href=' + users[1].userdata.primaryEmail + ']' });
    I.waitForText('Participants (1)');
    I.fillField('Add contact', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.waitForText('Participants (2)');
    //I.waitForElement({ css: '[href=' + users[2].userdata.primaryEmail + ']' });

    I.click('Create');

    I.seeElement('.tasks-detailview');

    I.see(testrailID);
    I.see(testrailName);
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    I.seeElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    I.seeElement('.participant-list .participant [title="' + users[2].userdata.primaryEmail + '"]');

    I.logout();

    I.login('app=io.ox/tasks', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.seeElement('.tasks-detailview');
    I.see(testrailID);
    I.see(testrailName);
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    //console.log('User 0' + users[0].userdata.primaryEmail);
    //console.log('User 1' + users[1].userdata.primaryEmail);
    //console.log('User 2' + users[2].userdata.primaryEmail);

    I.seeElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    I.seeElement('.participant-list .participant [title="' + users[2].userdata.primaryEmail + '"]');

    I.logout();

    I.login('app=io.ox/tasks', { user: users[2] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.seeElement('.tasks-detailview');
    I.see(testrailID);
    I.see(testrailName);
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    I.seeElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    I.seeElement('.participant-list .participant [title="' + users[2].userdata.primaryEmail + '"]');

    I.logout();
});
Scenario('[C7730] Create a private Task with participant', async function (I, users) {
    let testrailID = 'C7730';
    let testrailName = 'Create a private Task with participant';

    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);
    I.click('Expand form');
    I.click('Private');
    I.fillField('Add contact', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.click('Create');
    I.waitForElement('div .message[role="alert"]');
    I.see('Tasks with private flag cannot be delegated.');
    I.logout();
});
Scenario('[C7731] Create a Task in a shared folder', async function (I, users) {
    let testrailID = 'C7731';
    let testrailName = 'Create a Task in a shared folder';


    const folder = {
        module: 'tasks',
        subscribed: 1,
        title: testrailID,
        permissions: [
            {
                bits: 403710016,
                entity: users[0].userdata.id,
                group: false
            }, {
                bits: 4227332,
                entity: users[1].userdata.id,
                group: false
            }
        ]
    };
    I.createFolder(folder, '2', { user: users[0] });
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.selectFolder(testrailID);


    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');
    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);
    I.click('Expand form');
    I.fillField('Add contact', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.click('Create');
    I.seeElement('.tasks-detailview');

    I.logout();

    I.login('app=io.ox/tasks', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.selectFolder(testrailID);

    I.seeElement('.tasks-detailview');
    I.see(testrailID);
    I.see(testrailName);
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    I.seeElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    
    I.logout();
});
Scenario('[C7732] Create a Task in a shared folder without rights', async function (I, users) {
    let testrailID = 'C7732';
    let testrailName = 'Create a Task in a shared folder without rights a Task in a shared folder';


    const folder = {
        module: 'tasks',
        subscribed: 1,
        title: testrailID,
        permissions: [
            {
                bits: 403710016,
                entity: users[0].userdata.id,
                group: false
            }, {
                bits: 257,
                entity: users[1].userdata.id,
                group: false
            }
        ]
    };
    I.createFolder(folder, '2', { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[1] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.selectFolder(testrailID);
    I.seeTextEquals(testrailID, '.folder-name');
    I.seeElement('.classic-toolbar .disabled[data-action="create"]');
    I.logout();
});
Scenario('[C7733] Set Task startdate behind due date', async function (I) {
    let testrailID = 'C7733';
    let testrailName = 'Set Task startdate behind due date';
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);

    I.click('Expand form');

    I.click('All day');
    I.fillField({ css: '[data-attribute="start_time"] .datepicker-day-field' }, '12/14/2114');
    I.click({ css: '[data-attribute="start_time"] .time-field' });
    I.fillField({ css: '[data-attribute="start_time"] .time-field' }, '12:00 PM');

    I.fillField({ css: '[data-attribute="end_time"] .datepicker-day-field' }, '12/13/2114');
    I.click({ css: '[data-attribute="end_time"] .time-field' });
    I.click('Create');
    I.retry(5).seeTextEquals('The dialog contains invalid data', '[role="alert"] div');
    I.retry(5).seeTextEquals('The start date must be before the due date.', '[data-attribute="start_time"] div.error');
    I.retry(5).seeTextEquals('The due date must not be before the start date.', '[data-attribute="end_time"] div.error');
    I.logout();
});
Scenario('[C7734] Create Task without any information', async function (I) {
    let testrailID = 'C7734';
    let testrailName = 'Create Task without any information';
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');
    I.seeElement('.floating-window-content .btn-primary[disabled=""][data-action="save"]');
    I.logout();
});
Scenario('[C7738] Edit task with all fields filled', async function (I, users) {
    let testrailID = 'C7738';
    let testrailName = 'Edit task with all fields filled';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
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
        target_duration: '1337',
        actual_duration: '1337',
        target_costs: '1337',
        actual_costs: '1337',
        trip_meter: '1337mm',
        billing_information: 'Don not know any Bill',
        companies: 'Open-Xchange GmbH',
        note: testrailName,
        currency: 'EUR'
    };
    I.createTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.retry(5).waitForElement('.tasks-detailview');
    I.see('Estimated duration in minutes');
    I.see('1337');
    I.see('Actual duration in minutes');
    I.see('1337');
    I.see('Estimated costs');
    I.see('1337 EUR');
    I.see('Actual costs');
    I.see('1337 EUR');
    I.see('Distance');
    I.see('1337mm');
    I.see('Billing information');
    I.see('Don not know any Bill');
    I.see('Companies');
    I.see('Open-Xchange GmbH');

    I.clickToolbar('Edit');
    I.waitForElement('.io-ox-tasks-edit', 5);
    I.fillField({ css: '[name="target_duration"]' }, '1338');
    I.fillField({ css: '[name="actual_duration"]' }, '1338');
    I.fillField({ css: '[name="target_costs"]' }, '1338');
    I.fillField({ css: '[name="actual_costs"]' }, '1338');
    I.selectOption({ css: '[name="currency"]' }, 'RUB');
    I.fillField({ css: '[name="trip_meter"]' }, '1338mm');
    I.fillField({ css: '[name="billing_information"]' }, 'Yes, i know any Bill');
    I.fillField({ css: '[name="companies"]' }, 'Open-Xchange Inc.');
    I.click('Save');

    I.waitForDetached('.io-ox-tasks-edit', 5);
    I.dontSee('1337');
    I.dontSee('1337');
    I.dontSee('1337 EUR');
    I.dontSee('1337 EUR');
    I.dontSee('1337mm');
    I.dontSee('Don not know any Bill');
    I.dontSee('Open-Xchange GmbH');
    I.see('1338');
    I.see('1338');
    I.see('1338 RUB');
    I.see('1338 RUB');
    I.see('1338mm');
    I.see('Yes, i know any Bill');
    I.see('Open-Xchange Inc.');

    I.logout();
});
Scenario('[C7739] Change tasks due date in dropdown', async function (I, users) {
    const moment = require('moment');

    let testrailID = 'C7739';
    let testrailName = 'Change tasks due date in dropdown';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName

    };
    I.createTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    const days = ['tomorrow', 2, 3, 4, 5, 6, 'in one week'];
    days.forEach(function (day, i) {
        I.clickToolbar('Due');
        if (i === 0) I.clickToolbar(day);
        else if (i === 6) I.clickToolbar(day);
        else I.clickToolbar(moment().add(i + 1, 'days').format('dddd'));
        I.waitForText('Due ' + moment().add(i + 1, 'days').format('M/D/YYYY'), 5, '.tasks-detailview .end-date');
        I.waitForText(moment().add(i + 1, 'days').format('M/D/YYYY'), 5, '.vgrid .end_date');
    });
    I.logout();
});
Scenario('[C7740] Edit Task', async function (I, users) {
    let testrailID = 'C7740';
    let testrailName = 'Edit Task';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName

    };
    I.createTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.clickToolbar('Edit');
    I.waitForElement('.io-ox-tasks-edit', 5);

    I.fillField('Subject', testrailID + ' - 2');
    I.waitForText(testrailID + ' - 2', 5, '.floating-window-content .title');
    I.click('Save');
    I.waitForDetached('.io-ox-tasks-edit', 5);
    I.waitForText(testrailID + ' - 2', 5, '.tasks-detailview .title');
    I.waitForText(testrailID + ' - 2', 5, '[role="navigation"] .title');
    I.logout();
});
Scenario('[C7741] Mark Task as Done', async function (I, users) {
    let testrailID = 'C7741';
    let testrailName = 'Mark Task as Done';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName

    };
    I.createTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.clickToolbar('Done');
    I.waitForText('Done', 5, '[aria-label="Task list"] .status.badge-done');
    I.waitForText('Progress 100 %', 5, '.tasks-detailview .task-progress');
    I.waitForText('Done', 5, '.tasks-detailview .badge-done.state');
    I.waitForText('Date completed', 5);
    I.logout();
});
Scenario('[C7742] Mark Task as Undone', async function (I, users) {
    let testrailID = 'C7742';
    let testrailName = 'Mark Task as Undone';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName,
        percent_completed: 100,
        status: 3

    };
    I.createTask(task, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.clickToolbar('Undone');
    I.waitForText('Not started', 5, '[aria-label="Task list"] .status.badge-notstarted');
    I.dontSee('Progress 100 %');
    I.waitForText('Not started', 5, '.tasks-detailview .badge-notstarted');
    I.logout();
});
Scenario('[C7743] Move single Task', async function (I, users) {
    let testrailID = 'C7743';
    let testrailName = 'Move single Task';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName

    };
    I.createTask(task, { user: users[0] });
    const folder = {
        module: 'tasks',
        title: testrailID
    };
    I.createFolder(folder, taskDefaultFolder, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    //Dirty SHIT ! Need a helper for this
    I.click('//*[@class="classic-toolbar"]/*[@class="dropdown"][2]');
    I.waitForElement('.smart-dropdown-container.open .dropdown-menu');
    I.clickToolbar('Move');
    I.click('.modal [data-id="virtual/flat/tasks/private"] div.folder-arrow');
    I.click('.modal [aria-label="' + testrailID + '"]');
    I.wait('0.2');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.waitForDetached('.modal');
    I.selectFolder(testrailID);
    I.retry(5).click('[aria-label="C7743, ."]');
    //Dirty SHIT ! Need a helper for this
    I.waitForElement('.tasks-detailview', 5);
    I.waitForText(testrailID, 5, '.tasks-detailview .title');
    I.waitForText(testrailID, 5, '[role="navigation"] .title');


    I.logout();
});
Scenario('[C7744] Mark several task as done at the same time', async function (I, users) {
    let testrailID = 'C7744';
    let testrailName = 'Mark several task as done at the same time';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    let numberOfTasks = 3;
    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        var task = {
            title: id,
            folder_id: taskDefaultFolder,
            note: testrailName
        };
        I.createTask(task, { user: users[0] });
    }
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.click('[aria-label="Tasks toolbar"] .btn[title="Select all"]');
    I.seeNumberOfElements('li.selected.vgrid-cell', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');
    I.clickToolbar('Done');
    I.retry(5).seeNumberOfElements('[aria-label="Task list"][role="navigation"] .badge-done.status', numberOfTasks);
    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        I.click('[role="navigation"][aria-label="Task list"] [aria-label="' + testrailID + ' - ' + i + ', Done."]');
        I.waitForElement('[role="navigation"][aria-label="Task list"] [aria-label="' + testrailID + ' - ' + i + ', Done."].selected');
        I.waitForElement('.tasks-detailview', 5);
        I.waitForText(id, 5, '.tasks-detailview .title');
        I.waitForText('Progress 100 %', 5, '.tasks-detailview .task-progress');
        I.waitForText('Done', 5, '.tasks-detailview .badge-done.state');
        I.waitForText('Date completed', 5);
    }
    I.logout();
});
Scenario('[C7745] Mark several Task as Undone at the same time', async function (I, users) {
    let testrailID = 'C7745';
    let testrailName = 'Mark several Task as Undone at the same time';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    let numberOfTasks = 3;
    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        var task = {
            title: id,
            folder_id: taskDefaultFolder,
            note: testrailName,
            percent_completed: 100,
            status: 3
        };
        I.createTask(task, { user: users[0] });
    }
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.click('[aria-label="Tasks toolbar"] .btn[title="Select all"]');
    I.seeNumberOfElements('li.selected.vgrid-cell', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');
    I.clickToolbar('Undone');
    I.retry(5).seeNumberOfElements('[aria-label="Task list"][role="navigation"] .badge-notstarted.status', numberOfTasks);
    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        I.click('[role="navigation"][aria-label="Task list"] [aria-label="' + testrailID + ' - ' + i + ', Not started."]');
        I.waitForElement('[role="navigation"][aria-label="Task list"] [aria-label="' + testrailID + ' - ' + i + ', Not started."].selected');
        I.waitForElement('.tasks-detailview', 5);
        I.waitForText('Not started', 5, '.tasks-detailview .badge-notstarted');
        I.waitForText(id, 5, '.tasks-detailview .title');
    }
    I.logout();
});
Scenario('[C7746] Move several tasks to an other folder at the same time', async function (I, users) {
    let testrailID = 'C7746';
    let testrailName = 'Move several tasks to an other folder at the same time';
    const taskDefaultFolder = await I.getDefaultFolder('tasks', { user: users[0] });
    let numberOfTasks = 3;
    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        var task = {
            title: id,
            folder_id: taskDefaultFolder,
            note: testrailName
        };
        I.createTask(task, { user: users[0] });
    }
    const folder = {
        module: 'tasks',
        title: testrailID
    };
    I.createFolder(folder, taskDefaultFolder, { user: users[0] });
    I.login('app=io.ox/tasks', { user: users[0] });
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.waitForElement('.tasks-detailview', 5);
    I.click('[aria-label="Tasks toolbar"] .btn[title="Select all"]');
    I.seeNumberOfElements('li.selected.vgrid-cell', numberOfTasks);
    I.waitForText(numberOfTasks + ' items selected', 5, '.task-detail-container .message');

    //Dirty SHIT ! Need a helper for this
    I.click('//*[@class="classic-toolbar"]/*[@class="dropdown"]');
    I.waitForElement('.smart-dropdown-container.open .dropdown-menu');
    I.clickToolbar('Move');
    I.click('.modal [data-id="virtual/flat/tasks/private"] div.folder-arrow');
    I.click('.modal [aria-label="' + testrailID + '"]');
    I.wait('0.2');
    I.click('div.modal-footer > button.btn.btn-primary');
    I.waitForDetached('.modal');
    I.selectFolder(testrailID);
    //Dirty SHIT ! Need a helper for this

    for (let i = 0; i < numberOfTasks; i++) {
        let id = testrailID + ' - ' + i;
        I.click('[role="navigation"][aria-label="Task list"] [aria-label="' + testrailID + ' - ' + i + ', ."]');
        I.waitForElement('[role="navigation"][aria-label="Task list"] [aria-label="' + testrailID + ' - ' + i + ', ."].selected');
        I.waitForElement('.tasks-detailview', 5);
        I.waitForText(id, 5, '.tasks-detailview .title');
    }
    I.logout();
});
