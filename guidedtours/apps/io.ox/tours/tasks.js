/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/tours/tasks', [
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours',
    'io.ox/core/capabilities'
], function (Tour, gt, capabilities) {

    'use strict';

    var createApp;

    /* Tour: Tasks */
    Tour.registry.add({
        id: 'default/io.ox/tasks',
        app: 'io.ox/tasks',
        priority: 1
    }, function () {
        var taskTour = new Tour()
        .step()
            .title(gt('Creating a new task'))
            .content(gt('To create a new task, click on New task in the toolbar.'))
            .spotlight('.io-ox-tasks-window .primary-action .btn:visible, [data-ref="io.ox/tasks/actions/create"]:visible')
            .on('before:show', function () {
                if (createApp && !createApp.getWindow().floating.model.get('minimized')) {
                    createApp.getWindow().floating.onMinimize();
                }
            })
            .on('next', function () {
                if (createApp) {
                    if (createApp.getWindow().floating.model.get('minimized')) createApp.getWindow().floating.model.set('minimized', false);
                    return;
                }
                ox.load(['io.ox/tasks/edit/main']).then(function (edit) {
                    var app = edit.getApp();
                    createApp = app;
                    return $.when(app, app.launch());
                });
            })
            .end()
        .step()
            .title(gt('Entering the task\'s data'))
            .content(gt('Enter the subject, the start date, and a description.'))
            .waitFor('.io-ox-tasks-edit-window.active .io-ox-tasks-edit [data-extension-id="title"]')
            .spotlight('.io-ox-tasks-edit-window.active .io-ox-tasks-edit [data-extension-id="title"]')
            .on('before:show', function () {
                if ($('.io-ox-tasks-edit-window.active .io-ox-tasks-edit [data-extension-id="title"]').length === 0) return;
                $('.io-ox-tasks-edit-window.active .io-ox-tasks-edit [data-extension-id="title"]')[0].scrollIntoView();
            })
            .on('show', function () {
                $('.io-ox-tasks-edit-window.active .io-ox-tasks-edit [data-extension-id="title"]')[0].scrollIntoView();
            })
            .end()
        .step()
            .title(gt('Adding further details'))
            .content(gt('To add further details, click on Expand form.'))
            .spotlight('.io-ox-tasks-edit-window.active .io-ox-tasks-edit .expand-link')
            .on('before:show', function () {
                $('.io-ox-tasks-edit-window.active .io-ox-tasks-edit .expand-link')[0].scrollIntoView();
            })
            .on('next', function () {
                $('.io-ox-tasks-edit-window.active .expand-link[aria-expanded=false]').click();
            })
            .end()
        .step()
            .title(gt('Creating recurring tasks'))
            .content(gt('To create recurring tasks, enable Repeat. Functions for setting the recurrence parameters are shown.'))
            .spotlight('.io-ox-tasks-edit-window.active [data-extension-id="recurrence"]')
            .on('before:show', function () {
                $('.io-ox-tasks-edit-window.active [data-extension-id="recurrence"]')[0].scrollIntoView();
            })
            .end()
        .step()
            .title(gt('Using the reminder function'))
            .content(gt('To not miss the task, use the reminder function.'))
            .spotlight('.io-ox-tasks-edit-window.active [for="task-edit-reminder-select"]')
            .on('before:show', function () {
                $('.io-ox-tasks-edit-window.active [for="task-edit-reminder-select"]')[0].scrollIntoView();
            })
            .end()
        .step()
            .title(gt('Tracking the editing status'))
            .content(gt('To track the editing status, enter the current progress.'))
            .spotlight('.io-ox-tasks-edit-window.active [data-extension-id="status"]')
            .on('before:show', function () {
                $('.io-ox-tasks-edit-window.active [data-extension-id="status"]:last')[0].scrollIntoView();
            })
            .end();
        if (capabilities.has('filestore') && capabilities.has('delegate_tasks')) {
            taskTour.step()
                .title(gt('Inviting other participants'))
                .content(gt('To invite other participants, enter their names in the field below Participants. You can add documents as attachment to the task.'))
                .spotlight('.io-ox-tasks-edit-window.active .add-participant.task-participant-input-field')
                .on('before:show', function () {
                    $('.io-ox-tasks-edit-window.active .add-participant.task-participant-input-field:last')[0].scrollIntoView();
                })
                .on('next', function () {
                    $('.io-ox-tasks-edit-window.active .expand-details-link')[0].scrollIntoView();
                })
                .end();
        }
        taskTour.step()
            .title(gt('Entering billing information'))
            .content(gt('To enter billing information, click on Show details.'))
            .spotlight('.io-ox-tasks-edit-window.active .expand-details-link')
            .on('before:show', function () {
                $('.io-ox-tasks-edit-window.active .expand-details-link')[0].scrollIntoView();
            })
            .end()
        .step()
            .title(gt('Creating the task'))
            .content(gt('To create the task, click on Create.'))
            .spotlight('.io-ox-tasks-edit-window.active .btn.task-edit-save')
            .on('before:show', function () {
                if (createApp && createApp.getWindow().floating.model.get('minimized')) {
                    createApp.getWindow().floating.model.set('minimized', false);
                }
            })
            .end()
        .step()
            .title(gt('Sorting tasks'))
            .content(gt('To sort the tasks, click on the sort icon above the list. Select a sort criteria.'))
            .navigateTo('io.ox/tasks/main')
            .waitFor('.grid-options.dropdown')
            .spotlight('.grid-options.dropdown')
            .on('wait', function () {
                if (createApp && !createApp.getWindow().floating.model.get('minimized')) {
                    createApp.getWindow().floating.onMinimize();
                }
            })
            .end()
        .step()
            .title(gt('Editing multiple tasks'))
            .content(gt('To edit multiple tasks at once, enable the checkboxes at the left side of the tasks. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'))
            .spotlight('.vgrid-scrollpane')
            .hotspot('.io-ox-tasks-window .classic-toolbar [data-dropdown="view"] ul a[data-name="checkboxes"]')
            .waitFor('.io-ox-tasks-window .classic-toolbar [data-dropdown="view"] ul a[data-name="checkboxes"]')
            .on('wait', function () {
                $('.io-ox-tasks-window .classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
            })
            .on('hide', function () {
                $('.io-ox-tasks-window .classic-toolbar [data-dropdown="view"] ul').css('display', '');
            })
            .end()
        .on('stop', function () {
            if (createApp) {
                createApp.quit();
                createApp = null;
            }
        })
        .start();
    });
});
