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
                    });

                }
    };
            
    Events.extend(api);
   

    
    api.getTasks = function ()
    {
/*
        return userAPI.get().pipe(function (user) {
            api.getUpdates({
                start: start,
                end: start + 28 * 5 * DAY, //next four month?!?
                timestamp: 0,
                recurrence_master: true
            })
            .pipe(function (list) {
                // sort by start_date & look for unconfirmed appointments
                var invites = _.chain(list)
                    .filter(function (item) {
                        return _(item.users).any(function (item_user) {
                            return (item_user.id === user.id && (item_user.confirmation === 0));
                        });
                    })
                    .sortBy('start_date')
                    .value();
                if (invites.length > 0) {
                    api.trigger('new-invites', invites);
                }
                return invites;
            });
        });*/
    };
    
    return api;
});