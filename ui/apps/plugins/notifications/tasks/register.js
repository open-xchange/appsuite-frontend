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
    
    var NotificationView = Backbone.View.extend(
            {
        events: {
            'click [data-action="done"]': 'setTaskStatus'
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
        setTaskStatus: function (e)
        {
            e.stopPropagation();
            var now = new Date();
            api.update(now.getTime(), this.model.attributes.taskId, {status: 3});
            api.refresh();
            //this.$el.find(".status").removeClass(this.model.attributes.badge)
              //                          .addClass("badge badge-success")
                //                        .text(gt("Done"));
            
        },
        close: function ()
        {
            this.remove();
            this.unbind();
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
                    NEW_TASKS: gt('New Tasks')
                }
            }));
            this._collectionBinder.bind(this.collection, this.$('.notifications'));
            return this;
        }
    });
    
    ext.point('io.ox/core/notifications/register').extend({
        id: 'tasks',
        index: 300,
        register: function (controller) {
            var notifications = controller.get('io.ox/tasks', NotificationsView);
            
            api.on('new-tasks', function (e, tasks) {
                notifications.collection.reset([]);
                
                _(tasks).each(function (taskObj) {
                    var task = util.interpretTask(taskObj);
                    var inObj = {
                        badge: task.badge,
                        taskId: task.id,
                        title: task.title,
                        note: task.note,
                        end_date: task.end_date,
                        status: task.status,
                        priority: task.priority
                    };
                    notifications.collection.push(inObj);
                });
            });
            
            
            api.getTasks();
        }
    });

    return true;
    
});