/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/conversations/api",
    ["io.ox/core/http", "io.ox/core/api/factory",
     "io.ox/core/config"
    ], function (http, apiFactory, config) {

    "use strict";

    // generate basic API
    var api = apiFactory({
        module: "conversation",
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
                folder: 'default'
            },
            list: {
                folder: 'default'
            },
            get: {
                action: "get"
            }
        }
    });

    api.addMembers = function (id, users) {
        return api.update(id, { newMembers: users || [] });
    };

    api.update = function (id, data) {
        return http.PUT({
                module: "conversation",
                params: { action: "update", id: id },
                data: data || {}
            })
            .done(function (data) {
                // returns updated full data, so we update all relevant caches
                api.caches.get.add(data);
                api.caches.list.add(data);
                // publish new state
                api.trigger("refresh.list");
            });
    };

    api.create = function (subject) {

        var def = $.Deferred(),
            display_names = [];

        function create(ids) {
            return http.PUT({
                    module: "conversation",
                    params: { action: "new" },
                    data: {
                        subject: subject || display_names.join(", "),
                        newMembers: ids
                    }
                });
        }

        // get all user IDs
        require(["io.ox/core/api/user"], function (userAPI) {
            userAPI.getAll()
                .pipe(function (data) {
                    return _(data)
                        .map(function (obj) {
                            display_names.push(obj.display_name);
                            return obj.id;
                        })
                        .sort();
                })
                .pipe(function (ids) {
                    // create new conversation
                    return create(ids)
                        .done(function (data) {
                            // trigger
                            api.caches.all.clear();
                            api.trigger("refresh.all");
                            def.resolve();
                        })
                        .fail(def.reject);
                })
                .fail(def.reject);
        });

        return def;
    };

    api.getMessages = function (id, since) {
        return http.GET({
            module: "conversation",
            params: {
                action: "allMessages",
                id: id,
                since: since || 0
            }
        });
    };

    api.sendMessage = function (id, text) {
        return http.PUT({
            module: "conversation",
            params: {
                action: "newMessage",
                id: id
            },
            data: {
                text: text
            }
        });
    };

    return api;
});