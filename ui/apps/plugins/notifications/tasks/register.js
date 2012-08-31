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

define('plugins/notifications/tasks/register', ['io.ox/core/extensions',
                                                'gettext!plugins/notifications/tasks',
                                                'dot!plugins/notifications/tasks/template.html',
                                                'io.ox/tasks/api',
                                                'io.ox/tasks/util',
                                                'less!plugins/notifications/tasks/style.css'],
                                                function (ext, gt, templ, api, util) {
    
    "use strict";
    
    //this file builds to notification views: dueTasks and reminderTasks
    
    /*
     * DUE TASKS
     */
    var NotificationView = Backbone.View.extend({
        events: {
            'click [data-action="done"]': 'setTaskStatus',
            'click .item': 'onClickItem'
        },
        _modelBinder: undefined,
        initialize: function () {
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            this.$el.empty().append(templ.render('plugins/notifications/tasks/taskitem', {}));
            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property');
            this._modelBinder.bind(this.model, this.el, bindings);
            this.$el.find(".status").addClass(this.model.attributes.badge);
            this.$el.find(".btn span").text(gt("Done"));
            return this;
        },
        setTaskStatus: function (e) {
            e.stopPropagation();
            var now = new Date();
            api.update(now.getTime(), this.model.attributes.taskId, {status: 3});
            this.close();
        },
        
        onClickItem: function (e) {
            var overlay = $('#io-ox-notifications-overlay');
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    // open SidePopup without arrow
                    new dialogs.SidePopup({ arrow: false, side: 'right' })
                        .setTarget(overlay.empty())
                        .show(e, function (popup) {
                            popup.append("<div> Detailview under construction </div>");
                        });
                });
        },
        
        close: function () {
            this.unbind();
            this.remove();
            this.model.destroy();
        }
    });
    
    var NotificationsView = Backbone.View.extend({
        className: 'notifications',
        id: 'io-ox-notifications-tasks',
        _collectionBinder: undefined,
        initialize: function () {
            var viewCreator = function (model) {
                return new NotificationView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);
        },
        render: function () {
            this.$el.empty().append(templ.render('plugins/notifications/tasks/new-tasks', {
                strings: {
                    NEW_TASKS: gt('Over due Tasks')
                }
            }));
            
            this._collectionBinder.bind(this.collection, this.$('.notifications'));
            return this;
        }
    });
    
    ext.point('io.ox/core/notifications/register').extend({
        id: 'dueTasks',
        index: 350,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasks', NotificationsView);

            api.on('new-tasks', function (e, tasks) {
                notifications.collection.trigger("reset");
                _(tasks).each(function (taskObj) {
                    var task = util.interpretTask(taskObj);
                    var inObj = {
                        badge: task.badge,
                        taskId: task.id,
                        title: task.title,
                        end_date: task.end_date,
                        status: task.status
                    };
                    notifications.collection.push(inObj);
                });
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
    var NotificationReminderView = Backbone.View.extend({
        events: {
            'click [data-action="ok"]': 'deleteReminder',
            'click [data-action="remindAgain"]': 'remindAgain',
            'click [data-action="selector"]': 'selectClicked',
            'click .item': 'onClickItem'
        },
        _modelBinder: undefined,
        initialize: function () {
            
            this._modelBinder = new Backbone.ModelBinder();
        },
        render: function () {
            this.$el.empty().append(templ.render('plugins/notifications/tasks/taskitemReminder', {}));
            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'data-property');
            this._modelBinder.bind(this.model, this.el, bindings);
            this.$el.find(".status").addClass(this.model.attributes.badge);
            this.$el.find(".dateselect").append(util.buildDropdownMenu(new Date()));
            this.$el.find(".taskremindbtn span").text(gt("Remind me again"));
            this.$el.find(".taskokbtn span").text(gt("Ok"));
            return this;
        },
        deleteReminder: function (e) {
            e.stopPropagation();
            api.deleteReminder(this.model.attributes.reminderId);
            this.close();
        },
        selectClicked: function (e) {
            e.stopPropagation();
        },
        remindAgain: function (e) {
            var endDate = new Date();
            endDate = util.computePopupTime(endDate, this.$el.find(".dateselect").find(":selected").attr("finderId"));
            api.remindMeAgain(endDate.getTime(), this.model.attributes.reminderId);
            e.stopPropagation();
            this.close();
        },
        
        onClickItem: function (e) {
            var overlay = $('#io-ox-notifications-overlay');
            
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    // open SidePopup without array
                    new dialogs.SidePopup({ arrow: false, side: 'right' })
                        .setTarget(overlay.empty())
                        .show(e, function (popup) {
                            popup.append("<div> Detailview under construction </div>");
                        });
                });

        },
        
        close: function () {
            this.unbind();
            this.remove();
            this.model.destroy();
        }
    });
    
    var NotificationsReminderView = Backbone.View.extend({
        className: 'notifications',
        id: 'io-ox-notifications-reminder-tasks',
        _collectionBinder: undefined,
        initialize: function () {
            var viewCreator = function (model) {
                return new NotificationReminderView({model: model});
            };
            var elManagerFactory = new Backbone.CollectionBinder.ViewManagerFactory(viewCreator);
            this._collectionBinder = new Backbone.CollectionBinder(elManagerFactory);
        },
        render: function () {
            this.$el.empty().append(templ.render('plugins/notifications/tasks/new-reminder-tasks', {
                strings: {
                    REMINDER: gt('Reminder'),
                    TASKS: gt('Tasks')
                }
            }));
            
            this._collectionBinder.bind(this.collection, this.$('.notifications'));

            return this;
        }
    });
    
    ext.point('io.ox/core/notifications/register').extend({
        id: 'reminderTasks',
        index: 300,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasksreminder', NotificationsReminderView);
            api.on('reminder-tasks', function (e, reminderTaskIds, reminderIds) {
                notifications.collection.trigger("reset");
                api.getAll().done(function (tasks) {
                    _(tasks).each(function (taskObj) {
                        var index = $.inArray(taskObj.id, reminderTaskIds);
                        if (index !== -1) {
                            var task = util.interpretTask(taskObj);
                            var inObj = {
                                badge: task.badge,
                                reminderId: reminderIds[index],
                                taskId: task.id,
                                title: task.title,
                                end_date: task.end_date,
                                status: task.status
                            };
                            notifications.collection.push(inObj);
                        }
                    });
                
                
                });
            });
            var now = new Date();
            api.getReminders(now.getTime());
        }
    });

    return true;
    
});