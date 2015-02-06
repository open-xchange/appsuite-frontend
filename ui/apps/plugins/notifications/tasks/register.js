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
     'less!plugins/notifications/tasks/style'
    ], function (ext, gt, api, reminderAPI) {

    'use strict';

    // this file builds three notification views: OVERDUE TASKS, TASK REMINDERS and TASK CONFIRMATIONS

    /*
     * OVERDUE TASKS
     */

    ext.point('io.ox/core/notifications/due-tasks/header').extend({
        draw: function () {
            this.append(
                $('<h1 class="section-title">').text(gt('Overdue Tasks')),
                $('<button type="button" class="btn btn-link clear-button fa fa-times refocus">')
                    .attr({ tabindex: 1,
                        'aria-label': gt('Hide all notifications for overdue tasks.'),
                        'data-action': 'clear',
                        'focus-id': 'task-overdue-notification-clear'
                    }),
                $('<ul class="items list-unstyled">')
            );
        }
    });

    function drawItem(node, model) {
        var endText = '',
            descriptionId = _.uniqueId('notification-description-');
        if (_.noI18n(model.get('end_date'))) {
            endText = gt('end date ') + _.noI18n(model.get('end_date'));
        }
                //#. %1$s task title
                //#. %2$s task end date
                //#, c-format
        var label = gt('%1$s %2$s.', _.noI18n(model.get('title')), endText);

        node.append(
            $('<li class="taskNotification item refocus" tabindex="1" role="listitem">')
            .attr({'data-cid': model.get('cid'),
                   'focus-id': 'task-overdue-notification-' + model.get('cid'),
                   'model-cid': model.cid,
                   'aria-label': label,
                   'aria-describedby': descriptionId})
            .append(
                $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                $('<span class="span-to-div title">').text(_.noI18n(model.get('title'))),
                $('<span class="end_date">').text(_.noI18n(model.get('end_date'))),
                $('<span class="status pull-right">').text(model.get('status')).addClass(model.get('badge')),
                $('<div class="actions">').append(
                    $('<button type="button" tabindex="1" class="refocus btn btn-default" data-action="done">')
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

        tagName: 'div',
        className: 'notifications',
        id: 'io-ox-notifications-tasks',

        events: {
            'click [data-action="done"]': 'setStatus',
            'click [data-action="clear"]': 'clearItems',
            'keydown [data-action="clear"]': 'clearItems',
            'click .item': 'openTask',
            'keydown .item': 'openTask'
        },

        render: function () {

            this.$el.empty();
            if (this.collection.length) {
                var baton = ext.Baton({ view: this });
                ext.point('io.ox/core/notifications/due-tasks/header').invoke('draw', this.$el, baton);

                this.collection.each(function (model) {
                    baton = ext.Baton({ model: model, view: this });
                    ext.point('io.ox/core/notifications/due-tasks/item').invoke('draw', this.$('.items'), baton);
                }, this);
            }
            return this;
        },

        clearItems: function (e) {
            if ((e.type === 'keydown') && (e.which !== 13)) { return; }
            //hide all items from view
            this.collection.each(function (item) {
                hiddenOverDueItems[_.ecid(item.attributes)] = true;
            });
            this.collection.reset();
        },

        setStatus: function (e) {
            e.stopPropagation();
            var item = $(e.currentTarget).closest('.item'),
                cid = item.attr('data-cid'),
                obj = _.cid(cid), model;
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
                //no focus restore when toggling
                lastFocus = undefined;
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

    //object to store hidden items (clear button uses this)
    var hiddenOverDueItems = {};

    ext.point('io.ox/core/notifications/register').extend({
        id: 'dueTasks',
        index: 500,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasks', NotificationsView);

            function add(e, tasks, reset) {
                var items = [];

                if(tasks.length > 0) {
                    require(['io.ox/tasks/util'], function (util) {
                        _(tasks).each(function (taskObj) {
                            if (!hiddenOverDueItems[_.ecid(taskObj)]) {
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
                                    //update data but don't throw events until we are finished(causes many redraws)
                                    notifications.collection.push(tmp, {merge: true, silent: true});
                                }
                            }
                        });
                        if (reset) {
                            notifications.collection.reset(items);
                        }
                    });
                } else if (reset) {
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
                $('<h1 class="section-title">').text(gt('Task reminders')),
                $('<button type="button" class="btn btn-link clear-button fa fa-times refocus">')
                    .attr({
                        tabindex: 1,
                        'aria-label': gt('Hide all task reminders.'),
                        'data-action': 'clear',
                        'focus-id': 'task-reminder-notification-clear'
                    }),
                $('<ul class="items list-unstyled">')
            );
        }
    });

    ext.point('io.ox/core/notifications/task-reminder/item').extend({
        draw: function (baton) {
            var self = this;
            require(['io.ox/tasks/util', 'io.ox/core/tk/reminder-util'], function (util, reminderUtil) {
                reminderUtil.draw(self, baton.model, util.buildOptionArray());
            });
        }
    });

    var ReminderView = Backbone.View.extend({

        className: 'taskNotification item',
        tagName: 'li',
        events: {
            'click [data-action="ok"]': 'deleteReminder',
            'change [data-action="reminder"]': 'remindAgain',
            'click [data-action="reminder"]': 'remindAgain',
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
            var obj = { id: this.model.get('reminder').id };
            if (this.model.get('reminder').recurrence_position) {
                obj.recurrence_position = this.model.get('reminder').recurrence_position;
            }
            reminderAPI.deleteReminder(obj);
            this.model.collection.remove(this.model);
        },

        remindAgain: function (e) {
            e.stopPropagation();
            var model = this.model,
                time = ($(e.target).data('value') || $(e.target).val()).toString(),
                key = [model.get('folder_id') + '.' + model.get('id')];
            if (time !== '0') {
                //0 means 'pick a time here' was selected. Do nothing.
                require(['io.ox/tasks/util'], function (util) {
                    reminderAPI.remindMeAgain(util.computePopupTime(time).alarmDate, model.get('reminder').id).then(function () {
                        //update Caches
                        return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
                    }).done(function () {
                        //update detailview
                        api.trigger('update:' + _.ecid(key[0]));
                    });
                    model.collection.remove(model);
                });
            }
        },

        onClickItem: function (e) {
            if ($(e.target).is('a') || $(e.target).is('i') || $(e.target).is('button') || $(e.target).is('ul')) {
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
                //no focus restore when toggling
                lastFocus = undefined;
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

        tagName: 'div',
        className: 'notifications',
        id: 'io-ox-notifications-reminder-tasks',
        events: {
            'keydown [data-action="clear"]': 'clearItems',
            'click [data-action="clear"]': 'clearItems'
        },

        render: function () {

            this.$el.empty();
            if (this.collection.length) {
                var baton = ext.Baton({ view: this });

                ext.point('io.ox/core/notifications/task-reminder/header').invoke('draw', this.$el, baton);

                this.collection.each(function (model) {
                    this.$el.find('.items').append(
                        new ReminderView({ model: model }).render().$el
                    );
                }, this);
            }
            return this;
        },

        clearItems: function (e) {
            if ((e.type === 'keydown') && (e.which !== 13)) { return; }
            //hide all items from view
            this.collection.each(function (item) {
                hiddenReminderItems[_.ecid(item.attributes.reminder)] = true;
            });
            this.collection.reset();
        }
    });

    //object to store hidden items (clear button uses this)
    var hiddenReminderItems = {};

    ext.point('io.ox/core/notifications/register').extend({
        id: 'reminderTasks',
        index: 200,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasksreminder', NotificationsReminderView);

            reminderAPI.on('set:tasks:reminder', function (e, reminders) {

                var taskIds = [];

                _(reminders).each(function (reminder) {
                    if (!hiddenReminderItems[_.ecid(reminder)]) {
                        taskIds.push({id: reminder.target_id,
                                      folder: reminder.folder});
                    }
                });

                if (taskIds.length === 0) {
                    //no reminders to display
                    notifications.collection.reset([]);
                    return;
                }

                api.getList(taskIds).done(function (tasks) {
                    if (tasks && tasks.length > 0) {
                        require(['io.ox/tasks/util'], function (util) {
                            var tempTasks = [];
                            _(tasks).each(function (task) {
                                _(reminders).each(function (reminder) {
                                    if (reminder.target_id === task.id) {
                                        var obj = util.interpretTask(task);
                                        obj.reminder = reminder;
                                        tempTasks.push(obj);
                                    }
                                });
                            });
                            notifications.collection.reset(tempTasks);
                        });
                    }
                });
            });
            api.on('delete', function (e, ids) {
                //ids of task objects
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            }).on('mark:task:confirmed', function (e, ids) {
                var reminders = [];
                _(ids).each(function (id) {
                    if ((!id.data || id.data.confirmation === 2) && notifications.collection._byId[id.id]) {
                        //remove reminders for declined tasks
                        var obj = { id: notifications.collection._byId[id.id].get('reminder').id };
                        if (notifications.collection._byId[id.id].get('reminder').recurrence_position) {
                            obj.recurrence_position = notifications.collection._byId[id.id].get('reminder').recurrence_position;
                        }
                        reminders.push(obj);
                        notifications.collection.remove(notifications.collection._byId[id.id]);
                    }
                });
                if (reminders.length > 0) {
                   //remove reminders correctly from server too
                   reminderAPI.deleteReminder(reminders);
                }
            });
            api.on('update', function (e, task) {
                if (notifications.collection._byId[task.id]) {
                    //get fresh data to be consistent(name, due date change etc)
                    reminderAPI.getReminders();
                }
            });
        }
    });

    /*------------------------------------------
    *
    * CONFIRMATION TASKS
    *
    *-------------------------------------------
    */

    ext.point('io.ox/core/notifications/task-confirmation/header').extend({
        draw: function () {
            this.append(
                $('<h1 class="section-title">').text(gt('Task invitations')),
                $('<button type="button" class="btn btn-link clear-button fa fa-times refocus">')
                    .attr({ tabindex: 1,
                        'aria-label': gt('Hide all task invitations.'),
                        'data-action': 'clear',
                        'focus-id': 'task-invitation-notification-clear'
                    }),
                $('<ul class="items list-unstyled">')
            );
        }
    });

    ext.point('io.ox/core/notifications/task-confirmation/item').extend({
        draw: function (baton) {
            var self = this;
            require(['io.ox/tasks/util'], function (util) {
                var task = util.interpretTask(baton.model.toJSON()),
                    endText = '',
                    descriptionId = _.uniqueId('notification-description-');
                if (baton.model.get('end_date')) {
                    endText = gt('end date ') + _.noI18n(baton.model.get('end_date'));
                }
                        //#. %1$s task title
                        //#. %2$s task end date
                        //#. %3$s task status
                        //#, c-format
                var label = gt('%1$s %2$s %3$s.', _.noI18n(baton.model.get('title')), endText ,baton.model.get('status'));
                self.attr({role: 'listitem',
                           'data-cid': _.ecid(baton.model.attributes),
                           'focus-id': 'task-invitation-' + _.ecid(baton.model.attributes),
                           tabindex: 1,
                           'aria-describedby': descriptionId,
                           'aria-label': label})
                .append(
                    $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                    $('<span class="span-to-div title">').text(_.noI18n(task.title)),
                    $('<div class="clearfix">').append(
                        $('<span class="end_date">').text(_.noI18n(task.end_date)),
                        $('<span class="status">').text(task.status).addClass(task.badge)),
                    $('<div class="actions">').append(
                        $('<button type="button" tabindex="1" class="accept-decline-button refocus btn btn-default" data-action="change_state">')
                        .attr('focus-id', 'task-invitation-accept-decline' + _.ecid(baton.model.attributes))
                        .text(gt('Accept/Decline')),
                        $('<button type="button" tabindex="1" class="refocus btn btn-success" data-action="accept">')
                            .attr({'aria-label': gt('Accept invitation'),
                                   'focus-id': 'task-invite-accept-' + _.ecid(baton.model.attributes)})
                            .append('<i class="fa fa-check">')
                    )
                );
                task = null;
            });
        }
    });

    var ConfirmationView = Backbone.View.extend({

        className: 'taskNotification item',
        tagName: 'li',
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
                //no focus restore when toggling
                lastFocus = undefined;
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
            //only open if click or enter is pressed
            if ((e.type !== 'click') && (e.which !== 13)) { return; }

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
            //only open if click or enter is pressed
            if ((e.type !== 'click') && (e.which !== 13)) { return; }

            var data = this.model.attributes;
            ox.load(['io.ox/calendar/acceptdeny', 'io.ox/tasks/api']).done(function (acceptdeny, api) {
                acceptdeny(data, {taskmode: true, api: api, callback: function () {
                    //update detailview
                    api.trigger('update:' + _.ecid({id: data.id, folder_id: data.folder_id}));
                }});
            });
        }
    });

    var NotificationsConfirmationView = Backbone.View.extend({

        tagName: 'div',
        className: 'notifications',
        id: 'io-ox-notifications-confirmation-tasks',

        events: {
            'keydown [data-action="clear"]': 'clearItems',
            'click [data-action="clear"]': 'clearItems'
        },

        render: function () {

            this.$el.empty();
            if (this.collection.length) {
                var baton = ext.Baton({ view: this });

                ext.point('io.ox/core/notifications/task-confirmation/header').invoke('draw', this.$el, baton);

                this.collection.each(function (model) {
                    this.$el.find('.items').append(
                        new ConfirmationView({ model: model }).render().$el
                    );
                }, this);
            }
            return this;
        },

        clearItems: function (e) {
            if ((e.type === 'keydown') && (e.which !== 13)) { return; }
            //hide all items from view
            this.collection.each(function (item) {
                hiddenInvitationItems[_.ecid(item.attributes)] = true;
            });
            this.collection.reset();
        }
    });

    //object to store hidden items (clear button uses this)
    var hiddenInvitationItems = {};

    ext.point('io.ox/core/notifications/register').extend({
        id: 'confirmationTasks',
        index: 400,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasksconfirmation', NotificationsConfirmationView);
            api.on('set:tasks:to-be-confirmed', function (e, confirmationTasks) {
                var items = [];
                _(confirmationTasks).each(function (task) {
                    if (!hiddenInvitationItems[_.ecid(task)]) {
                        items.push(
                            new Backbone.Model(task)
                        );
                    }
                });
                notifications.collection.reset(items);
            }).on('mark:task:confirmed', function (e, ids) {
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            }).on('mark:task:to-be-confirmed', function (e, ids) {
                _(ids).each(function (id) {
                    if (!hiddenInvitationItems[_.ecid(id)]) {
                        notifications.collection.push(new Backbone.Model(id), {silent: true});
                    }
                });
                notifications.collection.trigger('add');
            }).on('delete', function (e, ids) {
                _(ids).each(function (id) {
                    notifications.collection.remove(notifications.collection._byId[id.id]);
                });
            });
        }
    });

    return true;

});
