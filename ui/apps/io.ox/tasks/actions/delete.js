/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/actions/delete', [
    'gettext!io.ox/tasks',
    'io.ox/core/notifications'
], function (gt, notifications) {

    'use strict';

    return function (baton) {
        var data = baton.data,
            numberOfTasks = data.length || 1;
        ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {
            //build popup
            var popup = new dialogs.ModalDialog({ async: true })
                .addPrimaryButton('deleteTask', gt('Delete'), 'deleteTask', { tabIndex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 });
            //Header
            popup.getBody()
                .append($('<h4>')
                        .text(gt.ngettext('Do you really want to delete this task?',
                                          'Do you really want to delete these tasks?', numberOfTasks)));
            //go
            popup.show();
            popup.on('deleteTask', function () {
                require(['io.ox/tasks/api'], function (api) {
                    api.remove(data)
                        .done(function () {
                            notifications.yell('success', gt.ngettext('Task has been deleted!',
                                                                      'Tasks have been deleted!', numberOfTasks));
                            popup.close();
                        }).fail(function (result) {
                            if (result.code === 'TSK-0019') { //task was already deleted somewhere else. everythings fine, just show info
                                notifications.yell('info', gt('Task was already deleted!'));
                                popup.close();
                            } else if (result.error) {//there is an error message from the backend
                                popup.idle();
                                popup.getBody().empty().append($.fail(result.error, function () {
                                    popup.trigger('deleteTask', data);
                                })).find('h4').remove();
                            } else {//show generic error message
                                //show retrymessage and enable buttons again
                                popup.idle();
                                popup.getBody().empty().append($.fail(
                                    gt.ngettext(
                                        'The task could not be deleted.',
                                        'The tasks could not be deleted.',
                                        numberOfTasks
                                    ), function () {
                                    popup.trigger('deleteTask', data);
                                })).find('h4').remove();
                            }
                        });
                });
            });
        });
    };
});
