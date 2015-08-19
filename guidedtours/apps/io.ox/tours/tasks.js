/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/tours/tasks', [
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (Tour, gt) {

    'use strict';

    var createApp;

    /* Tour: Tasks */
    Tour.registry.add({
        id: 'default/io.ox/tasks',
        app: 'io.ox/tasks',
        priority: 1
    }, function () {
        new Tour()
        .step()
            .title(gt('Creating a new task'))
            .content(gt('To create a new task, click on New in the toolbar.'))
            .spotlight('[data-ref="io.ox/tasks/actions/create"]')
            .on('next', function () {
                ox.load(['io.ox/tasks/edit/main']).then(function (edit) {
                    var app = edit.getApp();
                    createApp = app;
                    return $.when(app, app.launch());
                }).then(function (app) {
                    return app.create({
                        folder_id: app.folder.get()
                    });
                });
            })
            .end()
        .step()
            .title(gt('Entering the task\'s data'))
            .content(gt('Enter the subject, the start date, and a description.'))
            .waitFor('.io-ox-tasks-edit [data-extension-id="title"]')
            .spotlight('.io-ox-tasks-edit [data-extension-id="title"]')
            .end()
        .step()
            .title(gt('Adding further details'))
            .content(gt('To add further details, click on Expand form.'))
            .spotlight('.io-ox-tasks-edit .expand-link')
            .on('next', function () {
                $('.expand-link[aria-expanded=false]').click();
            })
            .end()
        .step()
            .title(gt('Creating recurring tasks'))
            .content(gt('To create recurring tasks, enable Repeat. Functions for setting the recurrence parameters are shown.'))
            .spotlight('[data-extension-id="recurrence"]')
            .end()
        .step()
            .title(gt('Using the reminder function'))
            .content(gt('To not miss the task, use the reminder function.'))
            .spotlight('[for="task-edit-reminder-select"]')
            .end()
        .step()
            .title(gt('Tracking the editing status'))
            .content(gt('To track the editing status, enter the current progress.'))
            .spotlight('[data-extension-id="status"]')
            .end()
        .step()
            .title(gt('Inviting other participants'))
            .content(gt('To invite other participants, enter their names in the field below Participants. You can add documents as attachment to the task.'))
            .spotlight('.add-participant.task-participant-input-field')
            .end()
        .step()
            .title(gt('Entering billing information'))
            .content(gt('To enter billing information, click on Show details.'))
            .spotlight('.expand-details-link')
            .end()
        .step()
            .title(gt('Creating the task'))
            .content(gt('To create the task, click on Create on the upper right side.'))
            .spotlight('.btn.task-edit-save')
            .end()
        .step()
            .title(gt('Sorting tasks'))
            .content(gt('To sort the tasks, click on Sort by. Select a sort criteria.'))
            .navigateTo('io.ox/tasks/main')
            .waitFor('.grid-options.dropdown')
            .spotlight('.grid-options.dropdown')
            .end()
        .step()
            .title(gt('Editing multiple tasks'))
            .content(gt('To edit multiple tasks at once, enable the checkboxes at the left side of the tasks. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'))
            .spotlight('.vgrid-scrollpane')
            .hotspot('.classic-toolbar [data-dropdown=view]')
            .end()
        .on('stop', function () {
            if (createApp) {
                createApp.quit();
            }
        })
        .start();
    });
});
