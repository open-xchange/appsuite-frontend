/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('plugins/notifications/tasks/register', [
    'io.ox/core/extensions',
    'gettext!plugins/notifications',
    'io.ox/tasks/api',
    'io.ox/core/api/reminder',
    'io.ox/core/notifications/subview',
    'settings!io.ox/core',
    'io.ox/tasks/util',
    'less!plugins/notifications/tasks/style'
], function (ext, gt, api, reminderAPI, Subview, settings, util) {

    'use strict';

    var autoOpen = settings.get('autoOpenNotification', true);
    //change old settings values to new ones
    if (autoOpen === 'always' || autoOpen === 'noEmail') {
        autoOpen = true;
        settings.set('autoOpenNotification', true);
        settings.save();
    } else if (autoOpen === 'Never') {
        autoOpen = false;
        settings.set('autoOpenNotification', false);
        settings.save();
    }

    // this file builds three notification views: OVERDUE TASKS, TASK REMINDERS and TASK CONFIRMATIONS

    /*
     * OVERDUE TASKS
     */

    ext.point('io.ox/core/notifications/due-tasks/item').extend({
        draw: function (baton) {
            var self = this,
                data = util.interpretTask(baton.model.attributes),
                node = self.addClass('taskNotification');

            node.attr({
                'data-cid': _.cid(data),
                //#. %1$s task title
                //#, c-format
                'aria-label': gt('Overdue Task %1$s.', data.title)
            })
            .append(
                $('<a class="notification-info" role="button">').append(
                    $('<span class="span-to-div title">').text(data.title),
                    $('<div class"clearfix">').append(
                        $('<span class="end_date">').text(data.end_time),
                        $('<span class="status pull-right">').text(data.status).addClass(data.badge),
                        $('<span class="sr-only">').text(gt('Press to open Details'))
                    )
                ),
                $('<div class="actions">').append(
                    $('<button type="button" class="btn btn-default" data-action="done">').attr('aria-label', gt('Mark as done') + ' ' + baton.model.get('title'))
                    .text(gt('Done'))
                    .on('click', function (e) {
                        e.stopPropagation();
                        api.update({
                            id: data.id,
                            folder_id: data.folder_id,
                            status: 3,
                            percent_completed: 100,
                            date_completed: _.now()
                        }).done(function (result) {
                            api.trigger('update:' + _.ecid(data), result);
                        });
                        baton.view.removeNotifications(data.id);
                    })
                )
            );
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'dueTasks',
        index: 500,
        register: function () {
            var options = {
                    id: 'io.ox/duetasks',
                    api: api,
                    apiEvents: {
                        reset: 'new-tasks',
                        remove: 'delete unmark:overdue',
                        add: 'mark:overdue'
                    },
                    useListRequest: true,
                    title: gt('Overdue Tasks'),
                    extensionPoints: {
                        item: 'io.ox/core/notifications/due-tasks/item'
                    },
                    detailview: 'io.ox/tasks/view-detail',
                    autoOpen: autoOpen,
                    genericDesktopNotification: {
                        title: gt('New overdue tasks'),
                        body: gt('You have overdue tasks'),
                        icon: ''
                    },
                    specificDesktopNotification: function (model) {
                        var data = util.interpretTask(model.attributes),
                            endDateText = _.isEmpty(data.end_time) ? '' : ', ' + data.end_time;

                        return {
                            title: gt('New overdue task'),
                            body: data.title + endDateText,
                            icon: ''
                        };
                    },
                    hideAllLabel: gt('Hide all notifications for overdue tasks.')
                },
                subview = new Subview(options);

            //react to changes in settings
            settings.on('change:autoOpenNotification', function (value) {
                subview.model.set('autoOpen', value);
            });

            api.getTasks();
        }
    });

    /*------------------------------------------
     *
     * REMINDER TASKS
     *
     *------------------------------------------
     */

    ext.point('io.ox/core/notifications/task-reminder/item').extend({
        draw: function (baton) {
            var node = this.addClass('taskNotification');
            node.attr('data-cid', String(_.cid(baton.requestedModel.attributes)));
            require(['io.ox/core/tk/reminder-util'], function (reminderUtil) {
                var data = util.interpretTask(baton.model.attributes);
                reminderUtil.draw(node, new Backbone.Model(data), util.buildOptionArray(), true);
                node.on('click', '[data-action="ok"]', function (e) {
                    e.stopPropagation();

                    var model = baton.model,
                        time = node.find('[data-action="selector"]').val(),
                        key = [model.get('folder_id') + '.' + model.get('id')];

                    if (time !== '0') {
                        // 0 means 'don't remind me again was selected.
                        reminderAPI.remindMeAgain(util.computePopupTime(time).alarmDate, baton.requestedModel.get('id')).then(function () {
                            //update Caches
                            return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
                        }).done(function () {
                            //update detailview
                            api.trigger('update:' + _.ecid(key[0]));
                        });
                    } else {
                        reminderAPI.deleteReminder(baton.requestedModel.attributes);
                    }
                    baton.view.removeNotifications([baton.requestedModel]);
                });
            });
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'reminderTasks',
        index: 200,
        register: function () {
            var options = {
                    id: 'io.ox/remindertasks',
                    api: reminderAPI,
                    apiEvents: {
                        reset: 'set:tasks:reminder'
                    },
                    //#. Reminders (notifications) about tasks
                    title: gt('Task reminders'),
                    extensionPoints: {
                        item: 'io.ox/core/notifications/task-reminder/item'
                    },
                    detailview: 'io.ox/tasks/view-detail',
                    autoOpen: autoOpen,
                    genericDesktopNotification: {
                        //#. Title for a generic desktop notification about new reminders for tasks
                        title: gt('New task reminders'),
                        //#. Content for a generic desktop notification about new reminders for tasks
                        body: gt('You have new task reminders'),
                        icon: ''
                    },
                    specificDesktopNotification: function (model) {
                        var data = util.interpretTask(model.attributes),
                            endDateText = _.isEmpty(data.end_time) ? '' : ', ' + data.end_time;

                        return {
                            //#. Title for a desktop notification about a new reminder for a specific task
                            title: gt('New task reminder'),
                            body: data.title + endDateText,
                            icon: ''
                        };
                    },
                    //#. Reminders (notifications) about tasks
                    hideAllLabel: gt('Hide all task reminders.')
                },
                subview = new Subview(options);

            //react to changes in settings
            settings.on('change:autoOpenNotification', function (value) {
                subview.model.set('autoOpen', value);
            });

            reminderAPI.getReminders();
        }
    });

    /*------------------------------------------
    *
    * CONFIRMATION TASKS
    *
    *-------------------------------------------
    */

    ext.point('io.ox/core/notifications/task-confirmation/item').extend({
        draw: function (baton) {
            var node = this.addClass('taskNotification'),
                model = baton.model,
                view = baton.view,
                onChangeState = function (e) {
                    e.stopPropagation();
                    //only open if click or enter is pressed
                    if ((e.type !== 'click') && (e.which !== 13)) { return; }

                    var data = baton.model.attributes;
                    ox.load(['io.ox/calendar/actions/acceptdeny', 'io.ox/tasks/api']).done(function (acceptdeny, api) {
                        acceptdeny(data, {
                            taskmode: true,
                            api: api,
                            callback: function () {
                                //update detailview
                                api.trigger('update:' + _.ecid({ id: data.id, folder_id: data.folder_id }));
                            }
                        });
                    });
                },
                onClickAccept = function (e) {
                    e.stopPropagation();
                    //only open if click or enter is pressed
                    if ((e.type !== 'click') && (e.which !== 13)) { return; }

                    var o = {
                        id: baton.model.get('id'),
                        folder_id: baton.model.get('folder_id'),
                        data: { confirmmessage: '', confirmation: 1 }
                    };
                    view.responsiveRemove(model);
                    api.confirm(o).done(function () {
                        // remove model from hidden collection or new invitations when the appointment changes will not be displayed
                        view.hiddenCollection.remove(model);
                        //update detailview
                        api.trigger('update:' + _.ecid(o));
                    }).fail(function () {
                        view.unHide(model);
                    });
                };

            var task = util.interpretTask(baton.model.toJSON());
            node.attr({
                role: 'listitem',
                'data-cid': _.cid(baton.model.attributes),
                'focus-id': 'task-invitation-' + _.ecid(baton.model.attributes),
                //#. %1$s task title
                //#, c-format
                'aria-label': gt('Invitation for %1$s.', task.title),
                tabindex: 0
            })
            .append(
                $('<a class="notification-info" role="button">').append(
                    $('<span class="span-to-div title">').text(task.title),
                    $('<div class="clearfix">').append(
                        $('<span class="end_date">').text(task.end_time),
                        $('<span class="status">').text(task.status).addClass(task.badge)
                    ),
                    $('<span class="sr-only">').text(gt('Press to open Details'))
                ),
                $('<div class="actions">').append(
                    $('<button type="button" class="accept-decline-button refocus btn btn-default" data-action="change_state">')
                    .attr({
                        'focus-id': 'task-invitation-accept-decline' + _.ecid(baton.model.attributes),
                        // button aria labels need context
                        'aria-label': gt('Accept/Decline') + ' ' + task.title
                    })
                    .css('margin-right', '14px')
                    .text(gt('Accept/Decline'))
                    .on('click', onChangeState),
                    $('<button type="button" class="refocus btn btn-success" data-action="accept">')
                        .attr({
                            // button aria labels need context
                            'aria-label': gt('Accept invitation') + ' ' + task.title,
                            'focus-id': 'task-invite-accept-' + _.ecid(baton.model.attributes)
                        })
                        .append('<i class="fa fa-check" aria-hidden="true">')
                        .on('click', onClickAccept)
                )
            );
            task = null;
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'confirmationTasks',
        index: 400,
        register: function () {
            var options = {
                    id: 'io.ox/confirmationtasks',
                    api: api,
                    apiEvents: {
                        reset: 'set:tasks:to-be-confirmed',
                        remove: 'delete mark:task:confirmed',
                        add: 'mark:task:to-be-confirmed'
                    },
                    useListRequest: true,
                    //#. Inviations (notifications) to tasks
                    title: gt('Task invitations'),
                    extensionPoints: {
                        item: 'io.ox/core/notifications/task-confirmation/item'
                    },
                    detailview: 'io.ox/tasks/view-detail',
                    autoOpen: autoOpen,
                    genericDesktopNotification: {
                        //#. Title for a generic desktop notification about new invitations to tasks
                        title: gt('New task invitations'),
                        //#. Content for a generic desktop notification about new invitations to tasks
                        body: gt('You have new task invitations'),
                        icon: ''
                    },
                    specificDesktopNotification: function (model) {
                        var data = util.interpretTask(model.attributes),
                            endDateText = _.isEmpty(data.end_time) ? '' : ', ' + data.end_time;

                        return {
                            //#. Title for a desktop notification about a new invitation to a specific task
                            title: gt('New task invitation'),
                            body: data.title + endDateText,
                            icon: ''
                        };
                    },
                    //#. Inviations (notifications) to tasks
                    hideAllLabel: gt('Hide all task invitations.')
                },
                subview = new Subview(options);

            //react to changes in settings
            settings.on('change:autoOpenNotification', function (value) {
                subview.model.set('autoOpen', value);
            });
        }
    });

    return true;

});
