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
define("io.ox/core/api/reminder", ["io.ox/core/http",
                                   "io.ox/core/event"], function (http, Events) {
    "use strict";

    var api = {
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
                         id: reminderId,
                         timezone: 'UTC'
                         },
                data: {alarm: remindDate}
            });

        },

        getReminders: function (range, module) {

            return http.GET({
                module: "reminder",
                params: {
                    action: "range",
                    end: range || _.now()
                }
            }).pipe(function (list) {
                
                if (module === undefined || module === 4) {
                    //seperate task reminders from overall reminders
                    var reminderTaskId = [],
                        reminderCalId = [],
                        reminderId = [];
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].module === 4) {
                            reminderTaskId.push(list[i].target_id);
                            reminderId.push(list[i].id);
                        }
                        if (list[i].module === 1) {
                            reminderCalId.push(list[i]);
                        }
                    }
                    api.trigger('reminder-tasks', reminderTaskId, reminderId);//even if empty array is given it needs to be triggered to remove notifications that does not exist anymore(already handled in ox6 etc)
                    api.trigger('reminder-calendar', reminderCalId);//same as above
                }

                return list;
            });
        }
    };

    Events.extend(api);

    // global refresh
    api.refresh = function () {
        api.getReminders().done(function () {
            // trigger local refresh
            api.trigger("refresh.all");
        });
    };


    ox.on('refresh^', function () {
        api.refresh();
    });


    return api;

});