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

Scenario('[C7735] Discard Task without entered information', async ({ I, tasks }) => {

    // 1. Create a new task an click Discard

    I.login('app=io.ox/tasks');
    tasks.waitForApp();
    tasks.newTask();

    I.click('Discard');
    I.waitForDetached('.io-ox-tasks-edit');
    I.dontSee('Discard changes');
    I.dontSeeElement('[data-page-id="undefined/listView"] .selectable');
});
