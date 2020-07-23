
/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Search > Tasks');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Search via facet "global"', async (I, tasks, search) => {
    const folder = await I.grabDefaultFolder('tasks'),
        task = await I.haveTask({
            title: 'Global',
            note: 'dropdown',
            folder_id: folder
        });
    await I.haveAttachment('tasks', { id: task.id, folder: folder }, 'e2e/media/files/generic/testdocument.odt');

    I.login('app=io.ox/tasks');
    tasks.waitForApp();

    // not existing
    search.waitForWidget();
    search.doSearch('noneexisting');
    I.waitForText('No matching items found.');
    search.cancel();

    // global
    search.waitForWidget();
    search.doSearch('glob');
    I.waitNumberOfVisibleElements('.vgrid-cell', 1);
    search.cancel();

    // global: title
    search.waitForWidget();
    search.doSearch('glob', '.task_title');
    I.waitNumberOfVisibleElements('.vgrid-cell', 1);
    search.cancel();

    // global: description/node
    search.waitForWidget();
    search.doSearch('dropdown', '.task_description');
    I.waitNumberOfVisibleElements('.vgrid-cell', 1);
    search.cancel();

    // global: attachment name
    search.waitForWidget();
    search.doSearch('testdocument', '.task_attachment_name');
    I.waitNumberOfVisibleElements('.vgrid-cell', 1);
    search.cancel();
});

Scenario('Search via tasks status', async (I, tasks, search) => {
    await I.haveTask({
        title: 'Global',
        note: 'dropdown',
        // done
        status: 3,
        folder_id: await I.grabDefaultFolder('tasks')
    });

    I.login('app=io.ox/tasks');
    tasks.waitForApp();

    // no result
    search.waitForWidget();
    search.option('Task status', 'Waiting');
    I.waitForText('No matching items found.');
    search.cancel();

    // single result
    search.waitForWidget();
    search.option('Task status', 'Done');
    I.waitNumberOfVisibleElements('.vgrid-cell', 1);
    search.cancel();
});
