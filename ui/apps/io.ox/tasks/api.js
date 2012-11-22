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
                           "io.ox/core/config",
                           'io.ox/core/api/factory',
                           "io.ox/core/api/folder"], function (http, configApi, apiFactory, folderApi) {

    "use strict";


 // generate basic API
    var api = apiFactory({
        module: "tasks",
        keyGenerator: function (obj) {
            var folder = null;
            if (obj.folder) {
                folder = obj.folder;
            } else if (obj.folder_id) {
                folder = obj.folder_id;
            } else {
                console.log("no folderAttribute for cache Keygen found, using default");
                folder = folderApi.getDefaultFolder("tasks");
            }

            return obj ? folder + '.' + obj.id : '';
        },
        requests: {
            all: {
                folder: folderApi.getDefaultFolder("tasks"),
                columns: "1,20,101,200,202,203,220,300,301",
                sort: "202",
                order: "asc",
                cache: true, // allow DB cache
                timezone: "UTC"
            },
            list: {
                action: "list",
                columns: "1,20,101,200,202,203,220,300,301,309",
                timezone: "UTC"
            },
            get: {
                action: "get",
                timezone: "UTC"
            },
            search: {
                action: "search",
                columns: "1,20,200,202,220,300,301",
                sort: "202",
                order: "asc",
                timezone: "UTC",
                getData: function (query) {
                    return { folder: query.folder, pattern: query.pattern };
                }
            }
        }
    });


    api.create = function (task) {
                return http.PUT({
                    module: "tasks",
                    params: {action: "new",
                             timezone: "UTC"},
                    data: task,
                    appendColumns: false
                });
            };

    api.update = function (timestamp, taskId, modifications, folder) {
                //check if only one big array was given for exsample by modelfactory
                if (arguments.length === 1) {
                    timestamp = arguments[0].last_modified;
                    if (!timestamp) {
                        timestamp = _.now();
                    }
                    taskId = arguments[0].id;
                    modifications = arguments[0];
                    folder = arguments[0].folder_id;
                    if (!folder) {
                        folder = arguments[0].folder;
                    }
                    
                }
                //go on normaly
                var useFolder;
                if (folder === undefined) {
                    useFolder = api.getDefaultFolder();
                } else {
                    useFolder = folder;
                }
                var key = useFolder + "." + taskId;

                return http.PUT({
                    module: "tasks",
                    params: {action: "update",
                        folder: useFolder,
                        id: taskId,
                        timestamp: timestamp,
                        timezone: "UTC"
                    },
                    data: modifications,
                    appendColumns: false
                }).pipe(function () {
                    // update cache
                    return $.when(api.caches.get.remove(key), api.caches.list.remove(key));
                }).pipe(function () {
                    //return object with id and folder id needed to save the attachments correctly
                    return {folder_id: useFolder, id: taskId};
                }).done(function () {
                    //trigger refresh, for vGrid etc
                    api.trigger('refresh.all');
                });

            };
    api.move = function (task, newFolder) {
        var folder = task.folder_id;
        if (!folder) {
            folder = task.folder;
        }
        // call updateCaches (part of remove process) to be responsive
        return api.updateCaches(task).pipe(function () {
            // trigger visual refresh
            api.trigger('refresh.all');
            return api.update(_.now(), task.id, {folder_id: newFolder}, folder);
        });
    };
    
    api.confirm =  function (options) { //options.id is the id of the task not userId
        return http.PUT({
            module: "tasks",
            params: {
                action: "confirm",
                folder: options.folder_id || options.folder,
                id: options.id,
                timezone: "UTC"
            },
            data: options.data, // object with confirmation attribute
            appendColumns: false
        });
    };

    api.getDefaultFolder = function () {
        return folderApi.getDefaultFolder('tasks');
    };

    //for notification view
    api.getTasks = function () {

        return http.GET({
            module: "tasks",
            params: {action: "all",
                folder: api.getDefaultFolder(),
                columns: "1,20,200,202,220,203,300,309",
                sort: "202",
                order: "asc",
                timezone: "UTC"
            }
        }).pipe(function (list) {
            // sorted by end_date filter over due Tasks
            var now = new Date(),
                userId = configApi.get('identifier'),
                dueTasks = [],
                confirmTasks = [];
            for (var i = 1; i < list.length; i++) {
                var filterOverdue = (list[i].end_date < now.getTime() && list[i].status !== 3 && list[i].end_date !== null);
                if (filterOverdue) {
                    dueTasks.push(list[i]);
                }
                for (var a = 0; a < list[i].participants.length; a++) {
                    if (list[i].participants[a].id === userId && list[i].participants[a].confirmation === 0) {
                        confirmTasks.push(list[i]);
                        
                    }
                }
            }
            if (dueTasks.length > 0) {
                api.trigger('new-tasks', dueTasks);
            }
            if (confirmTasks.length > 0) {
                api.trigger('confirm-tasks', confirmTasks);
            }
            return list;
        });
    };

    // global refresh
    api.refresh = function () {
        if (ox.online) {
            // clear "all & list" caches
            api.caches.all.clear();
            api.caches.list.clear();
            api.getTasks().done(function () {
                // trigger local refresh
                api.trigger("refresh.all");
            });
        }

    };

    return api;
});
