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
                // do not use "gt.ngettext" for plural without count
                title: (numberOfTasks === 1) ?
                    //#. header for a modal dialog to confirm the deletion of one task
                    gt('Delete task') :
                    //#. header for a modal dialog to confirm the deletion of multiple tasks
                    gt('Delete tasks'),
                // do not use "gt.ngettext" for plural without count
                description: (numberOfTasks === 1) ?
                    gt('Do you really want to delete this task?') :
                    gt('Do you really want to delete these tasks?'),
                async: true
            })
            .addCancelButton()
            .addButton({ label: gt('Delete'), action: 'deleteTask' })
            .on('deleteTask', function () {
                require(['io.ox/tasks/api'], function (api) {
                    api.remove(data).done(function () {
                        // do not use "gt.ngettext" for plural without count
                        notifications.yell('success', (numberOfTasks === 1) ?
                            gt('Task has been deleted') :
                            gt('Tasks have been deleted')
                        );
                        popup.close();
                    })
                    .fail(function (result) {
                        if (result.code === 'TSK-0019') { // task was already deleted somewhere else. everythings fine, just show info
                            notifications.yell('info', gt('Task has been deleted already'));
                        } else if (result.error) {
                            // there is an error message from the backend
                            popup.idle();
                            notifications.yell('error', result.error);
                        } else {
                            // show generic error message
                            // do not use "gt.ngettext" for plural without count
                            notifications.yell('error', (numberOfTasks === 1) ?
                                gt('The task could not be deleted.') :
                                gt('The tasks could not be deleted.')
                            );
                        }
                        popup.idle().close();
                    });
                });
            }).open();
        });
    };
});
