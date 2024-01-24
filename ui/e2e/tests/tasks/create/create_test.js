/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

Feature('Tasks > Create');

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

Scenario('[C7730] Create a private Task with participant', async function ({ I, users, tasks }) {
    const testrailID = 'C7730',
        testrailName = 'Create a private Task with participant';

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);
    I.click('Expand form');
    I.click('Private');
    I.fillField('Add contact', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.waitForElement(locate('.participant-email').withText(users[1].userdata.primaryEmail).inside('.participant-wrapper'));
    I.click('Create');
    I.waitForElement('.message[role="alert"]', 5);
    I.see('Tasks with private flag cannot be delegated.');
});

Scenario('[C7728] Create simple Task', async function ({ I, tasks }) {
    const testrailID = 'C7728',
        testrailName = 'Create simple Task';

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);

    tasks.create();

    I.see(testrailID, '.tasks-detailview');
    I.see(testrailName, '.tasks-detailview');
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
});

Scenario('[C7732] Create a Task in a shared folder without rights', async function ({ I, users, tasks }) {
    const testrailID = 'C7732';
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
        ],
        parent: await I.grabDefaultFolder('tasks')
    };
    I.haveFolder(folder, { user: users[0] });

    I.login('app=io.ox/tasks', { user: users[1] });
    tasks.waitForApp();
    I.waitForText('Empty');
    I.selectFolder(testrailID);
    I.waitForText(testrailID, 5, '.folder-name');
    I.waitForElement(locate('.classic-toolbar .disabled').withText('New').as('disabled "New" button in toolbar'));
});

// TODO: edit view and detail view timestamps differ about an hour, see Bug 68542
Scenario.skip('[C7727] Create task with all fields', async function ({ I, tasks }) {
    const testrailID = 'C7727';
    const testrailName = 'Create task with all fields';
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

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

    tasks.create();

    I.seeElement({ css: '[title="High priority"]' });
    I.see(testrailID);
    I.see(testrailName);

    // check in task-header
    I.see('Due 12/13/2114, 1:00 PM');
    I.see('Progress 25 %');
    I.see('In progress');

    // check in task-body
    I.see('Start date');
    I.see('12/13/2114, 12:00 PM');

    I.see('Estimated duration in minutes');
    I.see('25');
    I.see('Actual duration in minutes');
    I.see('45');
    I.see('Estimated costs');
    I.see('€27');
    I.see('Actual costs');
    I.see('€1,337');
    I.see('Distance');
    I.see('1337mm');
    I.see('Billing information');
    I.see("Don't know any Bill");
    I.see('Companies');
    I.see('Wurst Inc.');

    I.see('External participants');
    I.see('testdude1 <testdude1@test.test>');
});

Scenario('[C7729] Create Task with participants', async function ({ I, users, tasks }) {
    const testrailID = 'C7729';
    const testrailName = 'Create Task with participants';

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();
    I.fillField('Subject', testrailID);
    I.fillField('Description', testrailName);
    I.click('Expand form');
    I.fillField('Add contact', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.waitForText('Participants (1)');
    I.fillField('Add contact', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.waitForText('Participants (2)');

    tasks.create();
    I.see(testrailID, '.tasks-detailview');
    I.retry(5).see(testrailName, '.tasks-detailview');
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    I.waitForElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.participant-list .participant [title="' + users[2].userdata.primaryEmail + '"]');
    I.logout();

    I.login('app=io.ox/tasks', { user: users[1] });
    tasks.waitForApp();
    I.retry(5).see(testrailID, '.tasks-detailview');
    I.see(testrailName, '.tasks-detailview');
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    I.waitForElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.participant-list .participant [title="' + users[2].userdata.primaryEmail + '"]');
    I.logout();

    I.login('app=io.ox/tasks', { user: users[2] });
    tasks.waitForApp();
    I.retry(5).see(testrailID, '.tasks-detailview');
    I.see(testrailName, '.tasks-detailview');
    I.dontSeeElement({ css: '[title="High priority"]' });
    I.dontSeeElement({ css: '[title="Low priority"]' });
    I.see('Not started');
    I.waitForElement('.participant-list .participant [title="' + users[1].userdata.primaryEmail + '"]');
    I.waitForElement('.participant-list .participant [title="' + users[2].userdata.primaryEmail + '"]');
});
Scenario('[C7734] Create Task without any information', function ({ I, tasks }) {
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();
    I.seeElement('.floating-window-content .btn-primary[disabled=""][data-action="save"]');
});

Scenario('[C7733] Set Task startdate behind due date', async function ({ I, tasks }) {
    const testrailID = 'C7733';
    const testrailName = 'Set Task startdate behind due date';

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();
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
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario.skip('[C7731] Create a Task in a shared folder', async function ({ I, users, tasks }) {
    const id = 'C7731',
        desc = 'Create a Task in a shared folder',
        sharedFolder = await I.haveFolder({
            module: 'tasks',
            subscribed: 1,
            title: id,
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
            ],
            parent: await I.grabDefaultFolder('tasks')
        }, { user: users[0] });

    const checkTask = () => {
        I.waitForText(id, 5, '.vgrid-cell');
        I.click(id, '.vgrid-cell');
        I.waitForText(id, 2, '.tasks-detailview');
        I.see('Not started', '.vgrid-cell');
        I.dontSee('Due', '.info-panel');
        ['Low', 'Medium', 'High'].forEach(priority => {
            I.dontSeeElement('[title="' + priority + ' priority"]');
        });
    };

    I.login('app=io.ox/tasks&folder=' + sharedFolder, { user: users[1] });
    tasks.waitForApp();
    tasks.newTask();
    I.fillField('Subject', id);
    I.fillField('Description', desc);
    I.pressKey('Enter');
    I.click('Create');
    I.waitForDetached('.io-ox-tasks-edit-window');
    I.waitForElement('.tasks-detailview');
    checkTask();
    I.logout();

    I.login('app=io.ox/tasks&folder=' + sharedFolder, { user: users[0] });
    tasks.waitForApp();
    checkTask();
});

Scenario('[Bug 62240] Creating tasks while on a different time zone with a yearly or montly repeat leads to wrong dates', async function ({ I, tasks, dialogs }) {
    await I.haveSetting({
        'io.ox/core': { timezone: 'America/New_York' }
    });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.click('Expand form');
    I.checkOption('All day');
    I.fillField({ css: '[data-attribute="start_time"] .datepicker-day-field' }, '4/21/2020');

    I.checkOption('Repeat');
    I.click('Every Tuesday.');
    dialogs.waitForVisible();
    await within('.modal-dialog', async function () {
        I.selectOption('Repeat', 'Monthly');
        I.waitForText('Every month on day 21.');
    });
});
