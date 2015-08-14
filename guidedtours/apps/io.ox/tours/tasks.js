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
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (ext, notifications, utils, gt) {

    'use strict';

    /* Tour: Tasks */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/tasks',
        app: 'io.ox/tasks',
        priority: 1,
        tour: {
            id: 'Tasks',
            steps: [{
                title: gt('Creating a new task'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/tasks/actions/create"]')[0]; },
                content: gt('To create a new task, click on New in the toolbar.'),
                multipage: true,
                onNext: function () {
                    if ($('.launcher[data-app-name="io.ox/tasks/edit"]').length === 0) {
                        utils.switchToApp('io.ox/tasks/edit/main', function () {
                            window.hopscotch.nextStep();
                            window.hopscotch.prevStep();
                        });
                    } else {
                        $('.launcher[data-app-name="io.ox/tasks/edit"]').first().click();
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    }
                }
            },
            {
                title: gt('Entering the task\'s data'),
                placement: 'bottom',
                target: function () { return $('.io-ox-tasks-edit [data-extension-id="title"]:visible')[0]; },
                content: gt('Enter the subject, the start date, and a description.')
            },
            {
                title: gt('Adding further details'),
                placement: 'top',
                target: function () { return $('.io-ox-tasks-edit .expand-link:visible')[0]; },
                content: gt('To add further details, click on Expand form.'),
                onShow: function () {
                    if ($('[data-extension-id="start_date"]:visible').length === 0) {
                        $('.expand-link:visible').trigger('click');
                    }
                }
            },
            {
                title: gt('Creating recurring tasks'),
                placement: 'top',
                target: function () { return $('[data-extension-id="recurrence"]:visible')[0]; },
                content: gt('To create recurring tasks, enable Repeat. Functions for setting the recurrence parameters are shown.')
            },
            {
                title: gt('Using the reminder function'),
                placement: 'top',
                target: function () { return $('[for="task-edit-reminder-select"]:visible')[0]; },
                content: gt('To not miss the task, use the reminder function.')
            },
            {
                title: gt('Tracking the editing status'),
                placement: 'top',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('[for="task-edit-status-select"]:visible')[0].scrollIntoView(true);
                    }
                    return $('[for="task-edit-status-select"]:visible')[0];
                },
                content: gt('To track the editing status, enter the current progress.')
            },
            {
                title: gt('Inviting other participants'),
                placement: 'top',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('.add-participant.task-participant-input-field:visible')[0].scrollIntoView(true);
                    }
                    return $('.add-participant.task-participant-input-field:visible')[0];
                },
                content: gt('To invite other participants, enter their names in the field below Participants. You can add documents as attachment to the task.'),
                onShow: function () {
                    $('.tab-link[tabindex="0"]:visible').click();
                }
            },
            {
                title: gt('Entering billing information'),
                placement: (_.device('desktop') ? 'top' : 'left'),
                target: function () { return $('.task-edit-row [tabindex="2"]:visible')[0]; },
                content: gt('To enter billing information, click on Show details.'),
                onShow: function () { $('.tab-link[tabindex="2"]:visible').click(); }
            },
            {
                title: gt('Creating the task'),
                placement: 'left',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('.btn.task-edit-save:visible')[0].scrollIntoView(true);
                    }
                    return $('.btn.task-edit-save:visible')[0];
                },
                content: gt('To create the task, click on Create on the upper right side.'),
                multipage: true,
                onNext: function () {
                    utils.switchToApp('io.ox/tasks/main', function () {
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    });
                },
                onShow: function () {
                    $('.tab-link[tabindex="0"]:visible').click();
                }
            },
            {
                title: gt('Sorting tasks'),
                placement: 'bottom',
                target: function () { return $('.grid-options.dropdown:visible')[0]; },
                content: gt('To sort the tasks, click on Sort by. Select a sort criteria.'),
                xOffset: -10
            },
            {
                title: gt('Editing multiple tasks'),
                placement: 'bottom', // preventive fixed along with bug #34125
                target: function () { return $('.vgrid-scrollpane-container:visible')[0]; },
                //target: function () { return $('abs.vgrid-scrollpane:visible')[0]; },
                content: gt('To edit multiple tasks at once, enable the checkboxes at the left side of the tasks. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'),
                xOffset: -10
            }]
        }
    });
});
