/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions/delete', [
    'gettext!io.ox/tasks',
    'io.ox/core/notifications'
], function (gt, notifications) {

    'use strict';

    return function (data) {

        var numberOfTasks = data.length;

        ox.load(['io.ox/backbone/views/modal']).done(function (ModalDialog) {
            // build popup
            var popup = new ModalDialog({
                //#. 'Delete task' or 'Delete tasks' as header for a modal dialog to confirm the deletion of one or more tasks.
                title: gt.ngettext('Delete task', 'Delete tasks', numberOfTasks),
                description: gt.ngettext(
                    'Do you really want to delete this task?',
                    'Do you really want to delete these tasks?',
                    numberOfTasks
                ),
                async: true
            })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'deleteTask' })
            .on('deleteTask', function () {
                require(['io.ox/tasks/api'], function (api) {
                    api.remove(data).done(function () {
                        notifications.yell('success', gt.ngettext(
                            'Task has been deleted!',
                            'Tasks have been deleted!',
                            numberOfTasks
                        ));
                        popup.close();
                    })
                    .fail(function (result) {
                        if (result.code === 'TSK-0019') { // task was already deleted somewhere else. everythings fine, just show info
                            notifications.yell('info', gt('Task was already deleted!'));
                        } else if (result.error) {
                            // there is an error message from the backend
                            popup.idle();
                            notifications.yell('error', result.error);
                        } else {
                            // show generic error message
                            notifications.yell('error', gt.ngettext(
                                'The task could not be deleted.',
                                'The tasks could not be deleted.',
                                numberOfTasks
                            ));
                        }
                        popup.idle().close();
                    });
                });
            }).open();
        });
    };
});
