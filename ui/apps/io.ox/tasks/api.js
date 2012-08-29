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
    
    var api = { create: function (task)
            {
                return http.PUT({
                    module: "tasks",
                    params: {action: 'new'},
                    data: task,
                    appendColumns: false
                });
            },
            getAll: function ()
            {
                    return http.GET({
                        module: "tasks",
                        params: {action: 'all',
                            folder: require('io.ox/core/config').get('folder.tasks'),
                            columns: "200,202,203,300,309",
                            sort: "202",
                            order: "asc"
                        }
                    });

                },
            update: function (timestamp, taskId, modifications)
            {
                    return http.PUT({
                        module: "tasks",
                        params: {action: 'update',
                            folder: require('io.ox/core/config').get('folder.tasks'),
                            id: taskId,
                            timestamp: timestamp
                        },
                        data: modifications,
                        appendColumns: false
                    }).done(function ()
                            {
                        api.trigger("refresh.all");
                    });

                }
    };
            
    Events.extend(api);
   

    //for notification view
    api.getTasks = function ()
    {

        return http.GET({
            module: "tasks",
            params: {action: 'all',
                folder: require('io.ox/core/config').get('folder.tasks'),
                columns: "1,200,202,203,300,309",
                sort: "202",
                order: "asc"
            }
        }).pipe(function (list) {
                // sorted by end_date filter new tasks
                var now = new Date();
                var newTasks = [];
                for (var i = 1; i < list.length; i++)
                    {
                    if (list[i].end_date > now.getTime())
                        {
                        newTasks.push(list[i]);
                    }
                }
                if (newTasks.length > 0) {
                    api.trigger('new-tasks', newTasks);
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