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
                           'io.ox/core/api/factory',
                           "io.ox/core/api/folder"], function (http, apiFactory, folderApi) {
    
    "use strict";
    
    
 // generate basic API
    var api = apiFactory({
        module: "tasks",
        keyGenerator: function (obj) {
            return obj ? obj.folder_id + '.' + obj.id : '';
        },
        requests: {
            all: {
                folder: folderApi.getDefaultFolder("tasks"),
                columns: "1,20,200,202,203,300,309",
                sort: "202",
                order: "asc",
                cache: true // allow DB cache
            },
            list: {
                action: "list",
                columns: "1,20,200,202,203,300,309"
            },
            get: {
                action: "get"
            }
        }
    });
            
            
    api.create = function (task) {
                return http.PUT({
                    module: "tasks",
                    params: {action: "new"},
                    data: task,
                    appendColumns: false
                });
            };
            
    api.update = function (timestamp, taskId, modifications, folder) {
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
                        timestamp: timestamp
                    },
                    data: modifications,
                    appendColumns: false
                }).pipe(function () {
                    api.trigger("refresh.all");
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
    
    // global refresh
    api.refresh = function () {
        api.getTasks().done(function () {
            // trigger local refresh
            api.trigger("refresh.all");
        });
    };
    
    return api;
});