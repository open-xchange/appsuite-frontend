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
define("io.ox/tasks/api", ["io.ox/core/http",
                           "io.ox/core/event"], function (http, Events) {
    
    "use strict";
    
    var api = { create: function (task) {
                return http.PUT({
                    module: "tasks",
                    params: {action: "new"},
                    data: task,
                    appendColumns: false
                });
            },
            getAll: function () {
                    return http.GET({
                        module: "tasks",
                        params: {action: "all",
                            folder: require('io.ox/core/config').get('folder.tasks'),
                            columns: "1,200,202,203,300,309",
                            sort: "202",
                            order: "asc"
                        }
                    });

                },
            update: function (timestamp, taskId, modifications) {
                    return http.PUT({
                        module: "tasks",
                        params: {action: "update",
                            folder: require('io.ox/core/config').get('folder.tasks'),
                            id: taskId,
                            timestamp: timestamp
                        },
                        data: modifications,
                        appendColumns: false
                    });

                },
            deleteReminder: function (reminderId) {
                    return http.PUT({
                        module: "reminder",
                        params: {action: "delete"},
                        data: {id: reminderId}
                    });

                },
             remindMeAgain: function (remindDate, reminderId) {
                        return http.PUT({
                            module: "reminder",
                            params: {action: "remindAgain",
                                     id: reminderId
                                     },
                            data: {alarm: remindDate}
                        });

                    }
    };
            
    Events.extend(api);
   

    //for notification view
    api.getTasks = function () {

        return http.GET({
            module: "tasks",
            params: {action: "all",
                folder: require('io.ox/core/config').get('folder.tasks'),
                columns: "1,200,202,203,300,309",
                sort: "202",
                order: "asc"
            }
        }).pipe(function (list) {
            // sorted by end_date filter over due Tasks
            var now = new Date(),
                dueTasks = [];
            for (var i = 1; i < list.length; i++) {
                var filterOverdue = (list[i].end_date < now.getTime() && list[i].status !== 3 && list[i].end_date !== null);
                if (filterOverdue) {
                    dueTasks.push(list[i]);
                }
            }
            if (dueTasks.length > 0) {
                api.trigger('new-tasks', dueTasks);
            }
            return list;
        });
    };
    
    api.getReminders = function (range) {

        return http.GET({
            module: "reminder",
            params: {action: "range",
                end: range
            }
        }).pipe(function (list) {
            
                //seperate task reminders from overall reminders
                var reminderTaskId = [],
                    reminderId = [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i].module === 4) {
                        reminderTaskId.push(list[i].target_id);
                        reminderId.push(list[i].id);
                    }
                }
                if (reminderTaskId.length > 0) {
                    api.trigger('reminder-tasks', reminderTaskId, reminderId);
                }
                return list;
            });

    };
    
 // global refresh
    api.refresh = function () {
        api.getTasks().done(function () {
            // trigger local refresh
            api.trigger("refresh.all");
        });
    };

    
    return api;
});