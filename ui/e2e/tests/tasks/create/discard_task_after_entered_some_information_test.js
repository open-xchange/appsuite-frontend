/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Tasks > Create');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7736] Discard Task after entered some information', async ({ I, tasks, dialogs }) => {

    // 1. Create a new task and enter a title and then discard this task.

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.fillField('.title-field', 'Foobar');

    I.click('Discard');
    dialogs.waitForVisible();

    // 2. Click "Discard changes"

    dialogs.clickButton('Discard changes');
    I.waitForDetached('.modal-dialog');
    I.dontSeeElement('[data-page-id="undefined/listView"] .selectable');
});
