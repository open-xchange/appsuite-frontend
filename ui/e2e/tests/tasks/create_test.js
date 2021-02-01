/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


Feature('Tasks > Create');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: broken for last 5 runs (one hour missmatch between edit- and detail-view), see Bug 68542
Scenario.skip('create complete task', async function ({ I, tasks }) {
    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.fillField('Subject', 'Test Task');
    I.fillField('Description', 'Best Task evor!!!11elf');

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
    I.see('Test Task');
    I.see('Best Task evor!!!11elf');

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
