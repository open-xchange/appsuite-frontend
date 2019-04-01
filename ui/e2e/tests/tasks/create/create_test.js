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

Feature('Tasks > Create');

Before(async (users) => {
    await users.create();
    await users.create();
    await users.create();
});
After(async (users) => {
    await users.removeAll();
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
    I.waitForElement(locate('.participant-email').withText(users[1].userdata.primaryEmail).inside('.participant-wrapper'));
    I.click('Create');
    I.waitForElement('div .message[role="alert"]', 5);
    I.see('Tasks with private flag cannot be delegated.');
    I.logout();
});

Scenario('[C7728] Create simple Task', async function (I) {
    let testrailID = 'C7728';
    let testrailName = 'Create simple Task';
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window', 5);

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

Scenario('[C7732] Create a Task in a shared folder without rights', async function (I, users) {
    //BUG!
    let testrailID = 'C7732';

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
    I.waitForText(testrailID, '.folder-name');
    I.waitForElement('[aria-label="Tasks Toolbar"] .disabled[data-action="io.ox/tasks/actions/create"]');
    I.logout();
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
    I.waitForText('Participants (1)');
    I.fillField('Add contact', users[2].userdata.primaryEmail);
    I.pressKey('Enter');
    I.waitForText('Participants (2)');
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
Scenario('[C7734] Create Task without any information', async function (I) {
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');
    I.seeElement('.floating-window-content .btn-primary[disabled=""][data-action="save"]');
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
