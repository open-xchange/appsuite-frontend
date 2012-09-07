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
    
    var all_cache = {},//figure out how to use
        get_cache = {};
    
    var api = { create: function (task) {
                return http.PUT({
                    module: "tasks",
                    params: {action: "new"},
                    data: task,
                    appendColumns: false
                });
            },
            getAll: function (folder) {
                    var useFolder;
                    if (folder === undefined) {
                        useFolder = require('io.ox/core/config').get('folder.tasks');
                    } else {
                        useFolder = folder;
                    }
                    return http.GET({
                        module: "tasks",
                        params: {action: "all",
                            folder: useFolder,
                            columns: "1,20,200,202,203,300,309",
                            sort: "202",
                            order: "asc"
                        }
                    });

                },
            update: function (timestamp, taskId, modifications, folder) {
                var useFolder;
                if (folder === undefined) {
                    useFolder = require('io.ox/core/config').get('folder.tasks');
                } else {
                    useFolder = folder;
                }
                var key = useFolder + "." + taskId;
                
                return http.PUT({
                    module: "tasks",
                    params: {action: "update",
                        folder: useFolder,
                        id: taskId,
                        timestamp: timestamp
                    },
                    data: modifications,
                    appendColumns: false
                }).pipe(function () {
                    delete get_cache[key];
                });

            },
            needsRefresh: function (folder) {
                    // placeholder
                    return false;//all_cache[folder] !== undefined;
                },
            getList: function (ids) {
                    return http.PUT({
                            module: "tasks",
                            params: {
                                action: "list",
                                columns: "1,20,200,202,203,300,309"
                            },
                            data: http.simplify(ids),
                            appendColumns: false
                        });
                },
            get: function (task) {
                
                var key = (task.folder_id || task.folder) + "." + task.id;
                    
                if (get_cache[key] === undefined) {
                    return http.GET({
                            module: "tasks",
                            params: {
                                action: "get",
                                id: task.id,
                                folder: task.folder_id
                            }
                        }).done(function (data) {
                            console.log("ich bin nicht aus dem get_cache");
                            get_cache[key] = data;
                        });
                } else {
                    console.log("hey ich bin aus dem get_cache");
                    return $.Deferred().resolve(get_cache[key]);
                }
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
                columns: "1,20,200,202,203,300,309",
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
    

    ox.on('refresh^', function () {
        api.refresh();
    });
    
    return api;
});