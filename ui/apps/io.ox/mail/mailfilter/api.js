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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define("io.ox/mail/mailfilter/api",
        ["io.ox/core/http", "io.ox/core/event"], function (http, Events) {
    "use strict";

    var api = {
        deleteRule: function (ruleId, username) {

            return http.PUT({
                module: "mailfilter",
                params: {action: "delete",
                         username: username
                        },
                data: {id: ruleId}
            });

        },

        getRules: function (flag) {

            return http.GET({
                module: "mailfilter",
                params: {
                    action: "list",
                    flag: flag
                }
            });
        },

        update: function (data) {
            delete data.folder;

            var preparedData = {
                    "actioncmds": [data],
                    "id": 0
                };
            if (data.active) {
                preparedData.active = data.active;
                delete data.active;
            } else {
                preparedData.active = false;
            }
            return http.PUT({
                module: "mailfilter",
                params: {action: "update"},
                data: preparedData
            });
        }
    };

    Events.extend(api);

    // global refresh
    api.refresh = function () {
        api.getRules().done(function () {
            // trigger local refresh
            api.trigger("refresh.all");
        });
    };


    ox.on('refresh^', function () {
        api.refresh();
    });


    return api;

});