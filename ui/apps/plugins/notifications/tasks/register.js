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
                endText = '',
                data = util.interpretTask(baton.model.attributes),
                descriptionId = _.uniqueId('notification-description-'),
                node = self.addClass('taskNotification');
            if (_.noI18n(data.end_time)) {
                endText = gt('end date ') + _.noI18n(data.end_time);
            }
            //#. %1$s task title
            //#. %2$s task end date
            //#, c-format
            var label = gt('%1$s %2$s.', _.noI18n(baton.model.get('title')), endText);

            node.attr({
                    'data-cid': _.cid(data),
                    'aria-label': label,
                    'aria-describedby': descriptionId
                })
                .append(
                    $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                    $('<span class="span-to-div title">').text(_.noI18n(data.title)),
                    $('<div class"clearfix">').append(
                        $('<span class="end_date">').text(_.noI18n(data.end_time)),
                        $('<span class="status pull-right">').text(data.status).addClass(data.badge)
                    ),
                    $('<div class="actions">').append(
                        $('<button type="button" tabindex="1" class="btn btn-default" data-action="done">')
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
                        body: gt('You\'ve got overdue tasks'),
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
            settings.on('change:autoOpenNotification', function (e, value) {
                subview.model.set('autoOpen', value );
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
                    reminderAPI.deleteReminder(baton.requestedModel.attributes);
                    baton.view.collection.remove(baton.requestedModel.attributes);
                });
                node.find('[data-action="reminder"]').on('click change', function (e) {
                    //if we do this on smartphones the dropdown does not close correctly
                    if (!_.device('smartphone')) {
                        e.stopPropagation();
                    }

                    var model = baton.model,
                        time = ($(e.target).data('value') || $(e.target).val()).toString(),
                        key = [model.get('folder_id') + '.' + model.get('id')];
                    if (time !== '0') {
                        //0 means 'pick a time here' was selected. Do nothing.
                        reminderAPI.remindMeAgain(util.computePopupTime(time).alarmDate, baton.requestedModel.get('id')).then(function () {
                            //update Caches
                            return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
                        }).done(function () {
                            //update detailview
                            api.trigger('update:' + _.ecid(key[0]));
                        });
                        baton.view.collection.remove(baton.requestedModel);
                    }
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
                    title: gt('Task reminders'),
                    extensionPoints: {
                        item: 'io.ox/core/notifications/task-reminder/item'
                    },
                    detailview: 'io.ox/tasks/view-detail',
                    autoOpen: autoOpen,
                    genericDesktopNotification: {
                        title: gt('New task reminders'),
                        body: gt('You\'ve got task reminders'),
                        icon: ''
                    },
                    specificDesktopNotification: function (model) {
                        var data = util.interpretTask(model.attributes),
                            endDateText = _.isEmpty(data.end_time) ? '' : ', ' + data.end_time;

                        return {
                            title: gt('New task reminder'),
                            body: data.title + endDateText,
                            icon: ''
                        };
                    },
                    hideAllLabel: gt('Hide all task reminders.')
                },
                subview = new Subview(options);

            //react to changes in settings
            settings.on('change:autoOpenNotification', function (e, value) {
                subview.model.set('autoOpen', value );
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
                        acceptdeny(data, { taskmode: true, api: api, callback: function () {
                            //update detailview
                            api.trigger('update:' + _.ecid({ id: data.id, folder_id: data.folder_id }));
                        }});
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

            var task = util.interpretTask(baton.model.toJSON()),
                endText = '',
                descriptionId = _.uniqueId('notification-description-');
            if (baton.model.get('end_time')) {
                endText = gt('end date ') + _.noI18n(baton.model.get('end_time'));
            }
            //#. %1$s task title
            //#. %2$s task end date
            //#. %3$s task status
            //#, c-format
            var label = gt('%1$s %2$s %3$s.', _.noI18n(baton.model.get('title')), endText, baton.model.get('status'));
            node.attr({
                role: 'listitem',
                'data-cid': _.cid(baton.model.attributes),
                'focus-id': 'task-invitation-' + _.ecid(baton.model.attributes),
                tabindex: 1,
                'aria-describedby': descriptionId,
                'aria-label': label
            })
            .append(
                $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                $('<span class="span-to-div title">').text(_.noI18n(task.title)),
                $('<div class="clearfix">').append(
                    $('<span class="end_date">').text(_.noI18n(task.end_time)),
                    $('<span class="status">').text(task.status).addClass(task.badge)),
                $('<div class="actions">').append(
                    $('<button type="button" tabindex="1" class="accept-decline-button refocus btn btn-default" data-action="change_state">')
                    .attr('focus-id', 'task-invitation-accept-decline' + _.ecid(baton.model.attributes))
                    .css('margin-right', '14px')
                    .text(gt('Accept/Decline'))
                    .on('click', onChangeState),
                    $('<button type="button" tabindex="1" class="refocus btn btn-success" data-action="accept">')
                        .attr({
                            'aria-label': gt('Accept invitation'),
                            'focus-id': 'task-invite-accept-' + _.ecid(baton.model.attributes)
                        })
                        .append('<i class="fa fa-check">')
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
                    title: gt('Task invitations'),
                    extensionPoints: {
                        item: 'io.ox/core/notifications/task-confirmation/item'
                    },
                    detailview: 'io.ox/tasks/view-detail',
                    autoOpen: autoOpen,
                    genericDesktopNotification: {
                        title: gt('New task invitations'),
                        body: gt('You\'ve got task invitations'),
                        icon: ''
                    },
                    specificDesktopNotification: function (model) {
                        var data = util.interpretTask(model.attributes),
                            endDateText = _.isEmpty(data.end_time) ? '' : ', ' + data.end_time;

                        return {
                            title: gt('New task invitation'),
                            body: data.title + endDateText,
                            icon: ''
                        };
                    },
                    hideAllLabel: gt('Hide all task invitations.')
                },
                subview = new Subview(options);

            //react to changes in settings
            settings.on('change:autoOpenNotification', function (e, value) {
                subview.model.set('autoOpen', value );
            });
        }
    });

    return true;

});
