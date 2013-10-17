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

define('plugins/notifications/tasks/register',
    ['io.ox/core/extensions',
     'gettext!plugins/notifications',
     'io.ox/tasks/api',
     'io.ox/core/api/reminder',
     'io.ox/tasks/util',
     'io.ox/core/tk/reminder-util',
     'less!plugins/notifications/tasks/style.less'
    ], function (ext, gt, api, reminderAPI, util, reminderUtil) {

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
        var endText = '';
        if (_.noI18n(model.get('end_date'))) {
            endText = gt('end date ') + _.noI18n(model.get('end_date'));
        }
                //#. %1$s task title
                //#. %2$s task end date
                //#, c-format
        var label = gt('Overdue Task. %1$s %2$s. Press [enter] to open', _.noI18n(model.get('title')), endText);

        node.append(
            $('<div class="taskNotification item refocus" tabindex="1" role="listitem">')
            .attr({'data-cid': model.get('cid'),
                   'focus-id': 'task-overdue-notification-' + model.get('cid'),
                   'model-cid': model.cid,
                   'aria-label': label})
            .append(
                $('<div class="title">').text(_.noI18n(model.get('title'))),
                $('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge')),
                $('<div class="actions">').append(
                    $('<button type="button" tabindex="1" class="refocus btn btn-inverse" data-action="done">')
                    .attr('focus-id', 'task-overdue-notification-button-' + model.get('cid'))
                    .text(gt('Done'))
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
            'click .item': 'openTask',
            'keydown .item': 'openTask'
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
                    api.trigger('update:' + _.ecid(obj), result);
                });
            model = this.collection.get(item.attr('model-cid'));
            this.collection.remove(model);
        },

        openTask: function (e) {
            if ($(e.target).is('a') || $(e.target).is('i') || $(e.target).is('button')) {
                //ignore chevron and dropdownlinks
                return;
            }
            if ((e.type !== 'click') && (e.which !== 13)) { return; }
            var cid = $(e.currentTarget).attr('data-cid'),
                overlay = $('#io-ox-notifications-overlay'),
                lastFocus = e.target,
                sidepopup = overlay.prop('sidepopup');

            // toggle?
            if (sidepopup && cid === overlay.find('[data-cid]').attr('data-cid')) {
                lastFocus = undefined;//no focus restore when toggling
                sidepopup.close();
            } else {
                require(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail'], function (dialogs, viewDetail) {
                    // get task and draw detailview
                    api.get(_.cid(cid)).done(function (taskData) {
                        // open SidePopup without arrow
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay)
                            .on('close', function () {
                                if (_.device('smartphone') && overlay.children().length > 0) {
                                    overlay.addClass('active');
                                } else if (_.device('smartphone')) {
                                    overlay.removeClass('active');
                                    $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                                }
                                //restore focus
                                $(lastFocus).focus();
                            })
                            .show(e, function (popup) {
                                popup.append(viewDetail.draw(taskData));
                                if (_.device('smartphone')) {
                                    $('#io-ox-notifications').removeClass('active');
                                }
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
            reminderUtil.draw(this, baton.model, util.buildOptionArray(new Date()));
        }
    });

    var ReminderView = Backbone.View.extend({

        className: 'taskNotification item',

        events: {
            'click [data-action="ok"]': 'deleteReminder',
            'change [data-action="selector"]': 'remindAgain',
            'click [data-action="selector"]': 'remindAgain',
            'click': 'onClickItem',
            'keydown': 'onClickItem'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/task-reminder/item').invoke('draw', this.$el, baton);
            $('.dropdown-menu', this.$el).on('click', 'a', $.proxy(this.remindAgain, this));
            return this;
        },

        deleteReminder: function (e) {
            e.stopPropagation();
            reminderAPI.deleteReminder(this.model.get('reminder').id);
            this.model.collection.remove(this.model);
        },

        remindAgain: function (e) {
            e.stopPropagation();
            var endDate = new Date(),
                dates,
                model = this.model,
                time = ($(e.target).data('value') || $(e.target).val()).toString(),
                key = [model.get('folder_id') + '.' + model.get('id')];
            if (time !== '0') {//0 means 'pick a time here' was selected. Do nothing.
                dates = util.computePopupTime(endDate, time);
                endDate = dates.alarmDate;
                reminderAPI.remindMeAgain(endDate.getTime(), model.get('reminder').id).pipe(function () {
                    return $.when(api.caches.get.remove(key), api.caches.list.remove(key));//update Caches
                }).done(function () {
                    api.trigger('update:' + _.ecid(key[0]));//update detailview
                });
                model.collection.remove(model);
            }
        },

        onClickItem: function (e) {
            if ($(e.target).is('a') || $(e.target).is('i') || $(e.target).is('button')) {
                //ignore chevron and dropdownlinks
                return;
            }
            if ((e.type !== 'click') && (e.which !== 13)) { return; }

            var overlay = $('#io-ox-notifications-overlay'),
                obj = {
                    id: this.model.get('id'),
                    folder: this.model.get('folder_id')
                },
                sidepopup = overlay.prop('sidepopup'),
                lastFocus = e.target,
                cid = _.cid(obj);

                // toggle?
            if (sidepopup && cid === overlay.find('.tasks-detailview').attr('data-cid')) {
                lastFocus = undefined;//no focus restore when toggling
                sidepopup.close();
            } else {
                require(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail'], function (dialogs, viewDetail) {
                    // get task and draw detail view
                    api.get(obj, false).done(function (taskData) {
                        // open SidePopup without arrow
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay)
                            .on('close', function () {
                                if (_.device('smartphone') && overlay.children().length > 0) {
                                    overlay.addClass('active');
                                } else if (_.device('smartphone')) {
                                    overlay.removeClass('active');
                                    $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                                }
                                //restore focus
                                $(lastFocus).focus();
                            })
                            .show(e, function (popup) {
                                popup.append(viewDetail.draw(taskData));
                                if (_.device('smartphone')) {
                                    $('#io-ox-notifications').removeClass('active');
                                }
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

            reminderAPI.on('add:tasks:reminder', function (e, reminders) {
                var taskIds = [];
                _(reminders).each(function (reminder) {
                    taskIds.push({id: reminder.target_id,
                                  folder: reminder.folder});
                });
                api.getList(taskIds).done(function (tasks) {
                    _(tasks).each(function (task) {
                        _(reminders).each(function (reminder) {
                            if (reminder.target_id === task.id) {
                                var obj = util.interpretTask(task);
                                obj.reminder = reminder;
                                notifications.collection.add(new Backbone.Model(obj));
                            }
                        });
                    });
                });
            }).on('remove:reminder', function (e, ids) {//ids of task objects
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            });
            api.on('delete', function (e, ids) {//ids of task objects
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
                reminderAPI.getReminders();//to delete stored reminders
            }).on('mark:task:confirmed', function (e, ids) {
                _(ids).each(function (id) {
                    if (!id.data || id.data.confirmation === 2) {//remove reminders for declined tasks
                        notifications.collection.remove(notifications.collection._byId[id.id]);
                    }
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
            var task = util.interpretTask(baton.model.toJSON()),
                endText = '';
            if (_.noI18n(baton.model.get('end_date'))) {
                endText = gt('end date ') + _.noI18n(baton.model.get('end_date'));
            }
                    //#. %1$s task title
                    //#. %2$s task end date
                    //#, c-format
            var label = gt('Task invitation. %1$s %2$s %3$s. Press [enter] to open', _.noI18n(baton.model.get('title')), endText);
            this.attr({role: 'listitem',
                       'data-cid': _.ecid(baton.model.attributes),
                       'focus-id': 'task-invitation-' + _.ecid(baton.model.attributes),
                       tabindex: 1,
                       'aria-label': label})
            .append(
                $('<div class="title">').text(_.noI18n(task.title)),
                $('<span class="end_date">').text(_.noI18n(task.end_date)),
                $('<span class="status">').text(task.status).addClass(task.badge),
                $('<div class="actions">').append(
                    $('<button type="button" tabindex="1" class="accept-decline-button refocus btn btn-inverse" data-action="change_state">')
                    .attr('focus-id', 'task-invitation-accept-decline' + _.ecid(baton.model.attributes))
                    .text(gt('Accept/Decline')),
                    $('<button type="button" tabindex="1" class="refocus btn btn-success" data-action="accept">')
                        .attr({'title': gt('Accept invitation'),
                               'aria-label': gt('Accept invitation'),
                               'focus-id': 'task-invite-accept-' + _.ecid(baton.model.attributes)})
                        .append('<i class="icon-ok">')
                )
            );
            task = null;
        }
    });

    var ConfirmationView = Backbone.View.extend({

        className: 'taskNotification item',

        events: {
            'click': 'onClickItem',
            'keydown': 'onClickItem',
            'click [data-action="change_state"]': 'onChangeState',
            'keydown [data-action="change_state"]': 'onChangeState',
            'click [data-action="accept"]': 'onClickAccept',
            'keydown [data-action="accept"]': 'onClickAccept'
            //'dispose': 'close'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/task-confirmation/item').invoke('draw', this.$el, baton);
            return this;
        },

        onClickItem: function (e) {
            if ($(e.target).is('a') || $(e.target).is('i') || $(e.target).is('button')) {
                //ignore chevron and dropdownlinks
                return;
            }
            if ((e.type !== 'click') && (e.which !== 13)) { return; }

            var overlay = $('#io-ox-notifications-overlay'),
                obj = {
                    id: this.model.get('id'),
                    folder: this.model.get('folder_id')
                },
                lastFocus = e.target,
                sidepopup = overlay.prop('sidepopup'),
                cid = _.cid(obj);

               // toggle?
            if (sidepopup && cid === overlay.find('.tasks-detailview').attr('data-cid')) {
                lastFocus = undefined;//no focus restore when toggling
                sidepopup.close();
            } else {
                require(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail'], function (dialogs, viewDetail) {
                    // get task and draw detail view
                    api.get(obj, false).done(function (taskData) {
                        // open SidePopup without arrow
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay)
                            .on('close', function () {
                                if (_.device('smartphone') && overlay.children().length > 0) {
                                    overlay.addClass('active');
                                } else if (_.device('smartphone')) {
                                    overlay.removeClass('active');
                                    $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                                }
                                //restore focus
                                $(lastFocus).focus();
                            })
                            .show(e, function (popup) {
                                popup.append(viewDetail.draw(taskData));
                                if (_.device('smartphone')) {
                                    $('#io-ox-notifications').removeClass('active');
                                }
                            });
                    });
                });
            }
        },

        onClickAccept: function (e) {
            e.stopPropagation();
            if ((e.type !== 'click') && (e.which !== 13)) { return; }//only open if click or enter is pressed

            var model = this.model,
                o = {id: model.get('id'),
                     folder_id: model.get('folder_id'),
                     data: {confirmmessage: '', confirmation: 1 }};
            api.confirm(o).done(function () {
                //update detailview
                var data = model.toJSON();
                api.trigger('update:' + _.ecid(data));
            });
        },

        onChangeState: function (e) {
            e.stopPropagation();
            if ((e.type !== 'click') && (e.which !== 13)) { return; }//only open if click or enter is pressed

            var model = this.model;
            require(['io.ox/tasks/edit/util', 'io.ox/core/tk/dialogs'], function (editUtil, dialogs) {
                //build popup
                var popup = editUtil.buildConfirmationPopup(model, dialogs);
                //go
                popup.popup.show().done(function (action) {
                    if (action === 'ChangeConfState') {
                        var state = popup.state.prop('selectedIndex') + 1,
                            message = popup.message.val();
                        api.confirm({id: model.get('id'),
                                     folder_id: model.get('folder_id'),
                                     data: {confirmation: state,
                                            confirmmessage: message}
                        }).done(function () {
                            //update detailview
                            var data = model.toJSON();
                            api.trigger('update:' + _.ecid(data));
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
            api.on('set:tasks:to-be-confirmed', function (e, confirmationTasks) {
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
