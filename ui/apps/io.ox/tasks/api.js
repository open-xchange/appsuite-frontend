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
define("io.ox/tasks/api", ["io.ox/core/http"], function (http) {
    
    "use strict";
    
    var all_cache;
    
    var api = { CreateTask: function (task)
            {
                http.PUT({
                    module: "tasks",
                    params: {action: 'new'},
                    data: task
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
                    })
                        .done(function (data) {
                            all_cache = data;
                        });

                }
    };
            
   
    return api;
});