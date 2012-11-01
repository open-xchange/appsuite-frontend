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
     'less!plugins/notifications/tasks/style.css'
    ], function (ext, gt, api, reminderApi, util, templ) {

    'use strict';

    // this file builds two notification views: OVER DUE TASKS and TASK REMINDERS

    /*
     * OVER DUE TASKS
     */

    ext.point('io.ox/core/notifications/due-tasks/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Over due Tasks')),
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

        initialize: function () {
            this.collection.on('reset add remove', this.render, this);
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
            // this is a very strange API signature; just to have that said
            api.update(_.now(), obj.id, { status: 3, percent_completed: 100 }, obj.folder_id)
                .done(function (result) {
                    api.trigger('update:' + cid, result);
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

            api.on('new-tasks', function (e, tasks) {
                _(tasks).each(function (taskObj) {
                    var task = util.interpretTask(taskObj);
                    notifications.collection.push(
                        new Backbone.Model({
                            id: task.id,
                            folder_id: task.folder_id,
                            badge: task.badge,
                            title: _.noI18n(task.title),
                            end_date: task.end_date,
                            status: task.status,
                            cid: _.cid(task)
                        }),
                        { silent: true }
                    );
                });
                notifications.collection.trigger('reset');
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
            var model = baton.model;
            this.attr('data-cid', model.get('cid')).attr('model-cid', model.cid)
            .append(
                $('<div class="title">').text(_.noI18n(model.get('title'))),
                $('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge')),
                $('<div class="actions">').append(
                    $('<button class="btn btn-inverse taskremindbtn" data-action="remindAgain">').text(gt('Remind me again')),
                    $('<button class="btn btn-inverse taskokbtn" data-action="ok">').text(gt('Ok')),
                    $('<select class="dateselect" data-action="selector">')
                    .append(util.buildDropdownMenu(new Date()))
                )
            );
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
            this.close();
        },

        selectClicked: function (e) {
            e.stopPropagation();
        },

        remindAgain: function (e) {
            var endDate = new Date(),
                dates;
            dates = util.computePopupTime(endDate, this.$el.find(".dateselect").find(":selected").attr("finderId"));
            endDate = dates.alarmDate;
            reminderApi.remindMeAgain(endDate.getTime(), this.model.attributes.reminderId);
            e.stopPropagation();
            this.close();
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

        close: function () {
            this.remove();
            this.model.destroy();
        }
    });

    var NotificationsReminderView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-reminder-tasks',

        initialize: function () {
            this.collection.on('reset add remove', this.render, this);
        },

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

            reminderApi.on('reminder-tasks', function (e, reminderTaskIds, reminderIds) {

                api.getAll({}, false).done(function (tasks) {
                    _(tasks).each(function (taskObj) {
                        var index = $.inArray(taskObj.id, reminderTaskIds);
                        if (index !== -1) {
                            var task = util.interpretTask(taskObj);
                            notifications.collection.push(
                                new Backbone.Model({
                                    id: task.id,
                                    folder_id: task.folder_id,
                                    badge: task.badge,
                                    reminderId: reminderIds[index],
                                    title: task.title,
                                    end_date: task.end_date,
                                    status: task.status
                                }),
                                { silent: true }
                            );
                        }
                    });
                    notifications.collection.trigger('reset');
                });
            });

            reminderApi.getReminders(_.now());
        }
    });

    return true;

});