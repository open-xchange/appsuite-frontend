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


Feature('Tasks list view').tag('6');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('check actions', async function (I) {
    I.login('app=io.ox/tasks');
    I.waitForVisible('*[data-app-name="io.ox/tasks"]');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Subject', 'Test Task');

    I.click('Expand form');

    I.fillField({ css: '[data-attribute="start_time"] .datepicker-day-field' }, '12/13/2114');

    I.fillField({ css: '[data-attribute="end_time"] .datepicker-day-field' }, '12/13/2114');

    I.click('Create');

    I.seeElement('.tasks-detailview');

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

    // test edit
    I.clickToolbar('Edit');
    I.waitForVisible('.io-ox-tasks-edit-window');

    I.fillField('Description', 'Best Task evor!!!11elf');

    I.click('Save');

    I.waitForText('Best Task evor!!!11elf', 5, '.tasks-detailview');
    I.clickToolbar('Delete');
    I.click('Delete', '.modal-footer');
    I.waitForVisible('.summary.empty');
    I.waitForDetached('.modal-backdrop.in');

    I.logout();
});
