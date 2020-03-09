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


Feature('Tasks');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('check actions', async function (I, tasks, dialogs) {
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
