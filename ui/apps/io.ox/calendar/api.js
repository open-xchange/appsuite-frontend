/**
 *
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
 *
 */

define("io.ox/calendar/api", ["io.ox/core/http", "io.ox/core/event"], function (http, Events) {

    "use strict";

    // really stupid caching for speed
    var all_cache = {},
        get_cache = {};

    var DAY = 60000 * 60 * 24;

    var api = {
        get: function (o) {

            o = o || {};

            var params = {
                action: "get",
                id: o.id,
                folder: o.folder || o.folder_id
            };

            if (o.recurrence_position !== null) {
                params.recurrence_position = o.recurrence_position;
            }

            var key = (o.folder || o.folder_id) + "." + o.id + "." + (o.recurrence_position || 0);

            if (get_cache[key] === undefined) {
                return http.GET({
                        module: "calendar",
                        params: params
                    })
                    .done(function (data) {
                        get_cache[key] = data;
                    });
            } else {
                return $.Deferred().resolve(get_cache[key]);
            }
        },

        getAll: function (o) {

            o = $.extend({
                start: _.now(),
                end: _.now() + 28 * 1 * DAY
            }, o || {});

            // round start & end date
            o.start = (o.start / DAY >> 0) * DAY;
            o.end = (o.end / DAY >> 0) * DAY;

            var key = o.folder + "." + o.start + "." + o.end,
                params = {
                    action: "all",
                    columns: "1,20,207,201,200,202,400", // id, folder_id, recurrence_position, start_date, title, end_date, location
                    start: o.start,
                    end: o.end,
                    showPrivate: true,
                    recurrence_master: false,
                    sort: "201",
                    order: "asc"
                };


            if (o.folder !== undefined) {
                params.folder = o.folder;
            }

            if (all_cache[key] === undefined) {
                return http.GET({
                        module: "calendar",
                        params: params
                    })
                    .done(function (data) {
                        all_cache[key] = data;
                    });
            } else {
                return $.Deferred().resolve(all_cache[key]);
            }
        },

        getList: function (ids) {
            return http.fixList(ids,
                http.PUT({
                    module: "calendar",
                    params: {
                        action: "list"
                    },
                    data: http.simplify(ids)
                })
            );
        },

        search: function (query) {
            return http.PUT({
                    module: "calendar",
                    params: {
                        action: "search",
                        sort: "201",
                        order: "desc" // top-down makes more sense
                    },
                    data: {
                        pattern: query
                    }
                });
        },

        needsRefresh: function (folder) {
            // has entries in 'all' cache for specific folder
            return all_cache[folder] !== undefined;
        },

        update: function (o) {
            var key = o.folder_id + "." + o.id + "." + (o.recurrence_position || 0);
            if (_.isEmpty(o)) {
                return $.when();
            } else {
                return http.PUT({
                    module: 'calendar',
                    params: {
                        action: 'update',
                        id: o.id,
                        folder: o.folder_id,
                        timestamp: _.now()
                    },
                    data: o
                })
                .pipe(function (obj) {
                    var getObj = {};
                    if (!_.isUndefined(obj.conflicts)) {
                        //console.log('got conflicts');
                        //console.log(obj.conflicts);
                        var df = new $.Deferred();
                        df.reject(obj);
                        return df;
                    }

                    getObj.id = o.id;
                    getObj.folder = o.folder_id;
                    if (o.recurrence_position !== null) {
                        getObj.recurrence_position = o.recurrence_position;
                    }

                    all_cache = {};
                    delete get_cache[key];
                    return api.get(getObj)
                        .pipe(function (data) {
                            api.trigger('refresh.all');
                            api.trigger('update', data);
                            return data;
                        });
                });
            }

        },
        create: function (o) {
            return http.PUT({
                module: 'calendar',
                params: {
                    action: 'new'
                },
                data: o
            })
            .pipe(function (obj) {
                var getObj = {};
                if (!_.isUndefined(obj.conflicts)) {
                    var df = new $.Deferred();
                    df.reject(obj);
                    return df;
                }
                getObj.id = obj.id;
                getObj.folder = o.folder_id;
                if (o.recurrence_position !== null) {
                    getObj.recurrence_position = o.recurrence_position;
                }
                all_cache = {};
                return api.get(getObj)
                        .pipe(function (data) {
                            api.trigger('refresh.all');
                            api.trigger('created', getObj);
                            return data;
                        });
            });
        },

        // delete is a reserved word :( - but this will delete the
        // appointment on the server
        remove: function (o) {
            return http.PUT({
                module: 'calendar',
                params: {
                    action: 'delete',
                    timestamp: _.now()
                },
                data: o.data
            })
            .done(function (resp) {
                all_cache = {};
                api.trigger('refresh.all');
            });
        }
    };

    Events.extend(api);

    // global refresh
    api.refresh = function () {
        // clear caches
        all_cache = {};
        // trigger local refresh
        api.trigger("refresh.all");
    };

    return api;
});
