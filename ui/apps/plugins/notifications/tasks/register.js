/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('plugins/notifications/tasks/register',
    ['io.ox/core/extensions',
     'gettext!plugins/notifications',
     'io.ox/tasks/api',
     'io.ox/core/api/reminder',
     'io.ox/tasks/util',
     'less!plugins/notifications/tasks/style.less'
    ], function (ext, gt, api, reminderApi, util) {

    'use strict';

    // this file builds three notification views: OVERDUE TASKS, TASK REMINDERS and TASK CONFIRMATIONS

    /*
     * OVERDUE TASKS
     */

    ext.point('io.ox/core/notifications/due-tasks/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Overdue Tasks')),
                $('<div class="notifications">')
            );
        }
    });

    function drawItem(node, model) {
        node.append(
            $('<div class="taskNotification item">')
            .attr('data-cid', model.get('cid'))
            .attr('model-cid', model.cid)
            .append(
                $('<div class="title">').text(_.noI18n(model.get('title'))),
                $('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge')),
                $('<div class="actions">').append(
                    $('<button class="btn btn-inverse" data-action="done">').text(gt('Done'))
                )
            )
        );
    }

    ext.point('io.ox/core/notifications/due-tasks/item').extend({
        draw: function (baton) {
            drawItem(this, baton.model);
        }
    });

    var NotificationsView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-tasks',

        events: {
            'click [data-action="done"]': 'setStatus',
            'click .item': 'openTask'
        },

        render: function () {

            var baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/due-tasks/header').invoke('draw', this.$el.empty(), baton);

            this.collection.each(function (model) {
                baton = ext.Baton({ model: model, view: this });
                ext.point('io.ox/core/notifications/due-tasks/item').invoke('draw', this.$('.notifications'), baton);
            }, this);

            return this;
        },

        setStatus: function (e) {
            e.stopPropagation();
            var item = $(e.currentTarget).closest('.item'),
                cid = item.attr('data-cid'),
                obj = _.cid(cid), model;
            // now with much cooler api signature. YEAH!
            api.update({id: obj.id,
                        folder_id: obj.folder_id,
                        status: 3,
                        percent_completed: 100,
                        date_completed: _.now() })
                .done(function (result) {
                    api.trigger('update:' + encodeURIComponent(cid), result);
                });
            model = this.collection.getByCid(item.attr('model-cid'));
            this.collection.remove(model);
        },

        openTask: function (e) {

            var cid = $(e.currentTarget).attr('data-cid'),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup');

            // toggle?
            if (sidepopup && cid === overlay.find('[data-cid]').attr('data-cid')) {
                sidepopup.close();
            } else {
                require(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail'], function (dialogs, viewDetail) {
                    // get task and draw detailview
                    api.get(_.cid(cid)).done(function (taskData) {
                        // open SidePopup without arrow
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay)
                            .show(e, function (popup) {
                                popup.append(viewDetail.draw(taskData));
                            });
                    });
                });
            }
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'dueTasks',
        index: 350,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasks', NotificationsView);

            function add(e, tasks, reset) {
                var items = [];
                _(tasks).each(function (taskObj) {
                    var task = util.interpretTask(taskObj),
                        tmp = new Backbone.Model({
                            id: task.id,
                            folder_id: task.folder_id,
                            badge: task.badge,
                            title: _.noI18n(task.title),
                            end_date: task.end_date,
                            status: task.status,
                            cid: _.cid(task)
                        });
                    if (reset) {
                        items.push(tmp);
                    } else {
                        notifications.collection.push(tmp, {silent: true});
                    }
                });
                if (reset) {
                    notifications.collection.reset(items);
                }
            }

            function remove(e, tasks) {
                _(tasks).each(function (taskObj) {
                    notifications.collection.remove(notifications.collection._byId[taskObj.id]);
                });
            }
            //be responsive
            api.on('delete', remove);
            api.on('new-tasks', function (e, tasks) {
                add(e, tasks, true);
            });
            api.on('mark:overdue', function (e, tasks) {
                add(e, tasks);
                notifications.collection.trigger('add');
            });
            api.on('unmark:overdue', function (e, tasks) {
                remove(e, tasks);
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

    ext.point('io.ox/core/notifications/task-reminder/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Reminder')),
                $('<legend class="section-title smallertitle">').text(gt('Tasks')),
                $('<div class="notifications">')
            );
        }
    });

    ext.point('io.ox/core/notifications/task-reminder/item').extend({
        draw: function (baton) {
            var model = baton.model,
                selectionBox;

            this.attr('data-cid', model.get('cid')).attr('model-cid', model.cid)
            .append(
                $('<div class="title">').text(_.noI18n(model.get('title'))),
                $('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge')),
                $('<div class="task-actions">').append(
                    selectionBox = $('<select class="dateselect" data-action="selector">').append(util.buildDropdownMenu(new Date())),
                    $('<button class="btn btn-inverse taskremindbtn" data-action="remindAgain">').text(gt('Remind me again')),
                    $('<button class="btn btn-inverse taskRemindOkBtn" data-action="ok">').text(gt('OK'))

                )
            );
            selectionBox.val('15');//set to 15minutes as default
        }
    });

    var ReminderView = Backbone.View.extend({

        className: 'taskNotification item',

        events: {
            'click [data-action="ok"]': 'deleteReminder',
            'click [data-action="remindAgain"]': 'remindAgain',
            'click [data-action="selector"]': 'selectClicked',
            'click': 'onClickItem'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/task-reminder/item').invoke('draw', this.$el, baton);
            return this;
        },

        deleteReminder: function (e) {
            e.stopPropagation();
            reminderApi.deleteReminder(this.model.attributes.reminderId);
            this.model.collection.remove(this.model);
        },

        selectClicked: function (e) {
            e.stopPropagation();
        },

        remindAgain: function (e) {
            var endDate = new Date(),
                dates,
                model = this.model,
                key = [model.get('folder_id') + '.' + model.get('id')];

            dates = util.computePopupTime(endDate, this.$el.find(".dateselect").val());
            endDate = dates.alarmDate;
            reminderApi.remindMeAgain(endDate.getTime(), model.attributes.reminderId).pipe(function () {
                return $.when(api.caches.get.remove(key), api.caches.list.remove(key));//update Caches
            }).done(function () {
                api.trigger("update:" + key[0]);//update detailview
            });
            e.stopPropagation();
            model.collection.remove(model);
        },

        onClickItem: function (e) {

            var overlay = $('#io-ox-notifications-overlay'),
                obj = {
                    id: this.model.get('id'),
                    folder: this.model.get('folder_id')
                },
                sidepopup = overlay.prop('sidepopup'),
                cid = _.cid(obj);

                // toggle?
            if (sidepopup && cid === overlay.find('.tasks-detailview').attr('data-cid')) {
                sidepopup.close();
            } else {
                require(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail'], function (dialogs, viewDetail) {
                    // get task and draw detail view
                    api.get(obj, false).done(function (taskData) {
                        // open SidePopup without arrow
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay)
                            .show(e, function (popup) {
                                popup.append(viewDetail.draw(taskData));
                            });
                    });
                });
            }
        }
    });

    var NotificationsReminderView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-reminder-tasks',

        render: function () {

            var baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/task-reminder/header').invoke('draw', this.$el.empty(), baton);

            this.collection.each(function (model) {
                this.$el.append(
                    new ReminderView({ model: model }).render().$el
                );
            }, this);

            return this;
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'reminderTasks',
        index: 300,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasksreminder', NotificationsReminderView);

            reminderApi.on('set:tasks:reminder', function (e, reminderTaskIds, reminderIds) {
                api.getAll({}, false).done(function (tasks) {
                    var items = [];
                    _(tasks).each(function (taskObj) {
                        var index = $.inArray(taskObj.id, reminderTaskIds);
                        if (index !== -1) {
                            var task = util.interpretTask(taskObj);
                            items.push(
                                new Backbone.Model({
                                    id: task.id,
                                    folder_id: task.folder_id,
                                    badge: task.badge,
                                    reminderId: reminderIds[index],
                                    title: task.title,
                                    end_date: task.end_date,
                                    status: task.status
                                })
                            );
                        }
                    });
                    notifications.collection.reset(items);
                });
            });
            api.on('delete', function (e, ids) {
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            });
        }
    });

    /*------------------------------------------
    *
    * CONFIRMATION TASKS
    *
    *------------------------------------------
    */

    ext.point('io.ox/core/notifications/task-confirmation/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Task invitations')),
                $('<div class="notifications">')
            );
        }
    });

    ext.point('io.ox/core/notifications/task-confirmation/item').extend({
        draw: function (baton) {
            var task = util.interpretTask(baton.model.toJSON());
            this.attr('data-cid', baton.model.get('cid'))
            .append(
                $('<div class="title">').text(_.noI18n(task.title)),
                $('<span class="end_date">').text(_.noI18n(task.end_date)),
                $('<span class="status">').text(task.status).addClass(task.badge),
                $('<div class="actions">').append(
                    $('<button class="btn btn-inverse" data-action="change_state">').text(gt('Accept/Decline'))
                )
            );
            task = null;
        }
    });

    var ConfirmationView = Backbone.View.extend({

        className: 'taskNotification item',

        events: {
            'click': 'onClickItem',
            'click [data-action="change_state"]': 'onChangeState'
            //'dispose': 'close'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/task-confirmation/item').invoke('draw', this.$el, baton);
            return this;
        },

        onClickItem: function (e) {

            var overlay = $('#io-ox-notifications-overlay'),
                obj = {
                    id: this.model.get('id'),
                    folder: this.model.get('folder_id')
                },
                sidepopup = overlay.prop('sidepopup'),
                cid = _.cid(obj);

               // toggle?
            if (sidepopup && cid === overlay.find('.tasks-detailview').attr('data-cid')) {
                sidepopup.close();
            } else {
                require(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail'], function (dialogs, viewDetail) {
                    // get task and draw detail view
                    api.get(obj, false).done(function (taskData) {
                        // open SidePopup without arrow
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay)
                            .show(e, function (popup) {
                                popup.append(viewDetail.draw(taskData));
                            });
                    });
                });
            }
        },

        onChangeState: function (e) {
            e.stopPropagation();
            var model = this.model;
            require(['io.ox/tasks/edit/util', 'io.ox/core/tk/dialogs'], function (editUtil, dialogs) {
                //build popup
                var popup = editUtil.buildConfirmationPopup(model, dialogs);
                //go
                popup.popup.show().done(function (action) {
                    if (action === "ChangeConfState") {
                        var state = popup.state.prop('selectedIndex') + 1,
                            message = popup.message.val();
                        api.confirm({id: model.get('id'),
                                     folder_id: model.get("folder_id"),
                                     data: {confirmation: state,
                                            confirmmessage: message}
                        }).done(function () {
                            //update detailview
                            api.trigger("update:" + model.get('folder_id') + '.' + model.get('id'));
                            model.collection.remove(model);
                        });
                    }
                });
            });
        }
    });

    var NotificationsConfirmationView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-confirmation-tasks',

        render: function () {

            var baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/task-confirmation/header').invoke('draw', this.$el.empty(), baton);

            this.collection.each(function (model) {
                this.$el.append(
                    new ConfirmationView({ model: model }).render().$el
                );
            }, this);

            return this;
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'confirmationTasks',
        index: 400,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasksconfirmation', NotificationsConfirmationView);
            api.on('confirm-tasks', function (e, confirmationTasks) {
                var items = [];
                _(confirmationTasks).each(function (task) {
                    items.push(
                        new Backbone.Model(task)
                    );
                });
                notifications.collection.reset(items);
            }).on('mark:task:confirmed', function (e, ids) {
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            }).on('delete', function (e, ids) {
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            });
        }
    });

    return true;

});
