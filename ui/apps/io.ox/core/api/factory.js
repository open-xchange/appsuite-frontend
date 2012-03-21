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

define("io.ox/core/api/factory",
    ["io.ox/core/http",
     "io.ox/core/cache",
     "io.ox/core/event"], function (http, cache, Events) {

    "use strict";

    var fix = function (obj) {
        var clone = _.deepClone(obj);
        clone.folder = clone.folder || clone.folder_id;
        return clone;
    };

    return function (o) {

        // extend default options (deep)
        o = $.extend(true, {
            // globally unique id for caches
            id: null,
            // for caches
            keyGenerator: null, // ~ use default
            // module
            module: "",
            // for all, list, and get
            requests: {
                all: { action: "all" },
                list: { action: "list" },
                get: { action: "get" },
                search: { action: "search" },
                remove: { action: "delete" }
            },
            fail: { }
        }, o || {});

        // use module as id?
        o.id = o.id || o.module;

        // create 3 caches for all, list, and get requests
        var caches = {
            all: new cache.SimpleCache(o.id + "-all", true),
            list: new cache.ObjectCache(o.id + "-list", true, o.keyGenerator),
            get: new cache.ObjectCache(o.id + "-get", true, o.keyGenerator)
        };

        var api = {

            getAll: function (options, useCache, cache) {
                // merge defaults for "all"
                var opt = $.extend({}, o.requests.all, options || {});
                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                cache = cache || caches.all;
                // cache miss?
                var getter = function () {
                    return http.GET({
                        module: o.module,
                        params: opt
                    })
                    .done(function (data, timestamp) {
                        // remove deprecated entries
                        // TODO: consider folder_id
                        caches.get.keys().done(function (keys) {
                            var diff = _(keys)
                            .difference(
                                _(data).map(function (obj) {
                                    return caches.get.keyGenerator(obj);
                                })
                            );
                            caches.list.remove(diff);
                            caches.get.remove(diff);
                        });
                        // clear cache
                        cache.clear(); //TODO: remove affected folder only
                        // add to cache
                        cache.add(opt.folder, data, timestamp);
                    });
                };

                if (useCache) {
                    return cache.contains(opt.folder).pipe(function (check) {
                        if (check) {
                            return cache.get(opt.folder);
                        } else {
                            return getter();
                        }
                    });
                } else {
                    return getter();
                }
            },

            getList: function (ids, useCache) {
                // be robust
                ids = ids ? [].concat(ids) : [];
                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                // async getter
                var getter = function () {
                    return http.fixList(ids, http.PUT({
                        module: o.module,
                        params: o.requests.list,
                        data: http.simplify(ids)
                    }))
                    .done(function (data) {
                        // add to cache
                        caches.list.add(data);
                        // merge with "get" cache
                        caches.get.merge(data);
                    });
                };
                // empty?
                if (ids.length === 0) {
                    return $.Deferred().resolve([]);
                } else {
                    if (useCache) {
                        // cache miss?
                        return caches.list.contains(ids).pipe(function (check) {
                            if (check) {
                                return caches.list.get(ids);
                            } else {
                                return getter();
                            }
                        });
                    } else {
                        return getter();
                    }
                }
            },

            get: function (options, useCache) {
                // merge defaults for get
                var opt = $.extend({}, o.requests.get, options || {});
                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                // cache miss?

                var getter = function () {
                    return http.GET({
                        module: o.module,
                        params: fix(opt)
                    })
                    .done(function (data, timestamp) {
                        // add to cache
                        caches.get.add(data, timestamp);
                        // update list cache
                        caches.list.merge(data).done(function (ok) {
                            if (ok) {
                                api.trigger("refresh.list", data);
                            }
                        });
                    })
                    .fail(function (e) {
                        _.call(o.fail.get, e, opt, o);
                    });
                };


                if (useCache) {
                    return caches.get.contains(opt).pipe(function (check) {
                        if (check) {
                            return caches.get.get(opt);
                        } else {
                            return getter();
                        }
                    });
                } else {
                    return getter();
                }
            },

            remove: function (ids, local) {
                // be robust
                ids = ids || [];
                ids = _.isArray(ids) ? ids : [ids];
                var opt = $.extend({}, o.requests.remove, { timestamp: _.now() });
                // done
                var done = function () {
                    // find affected mails in simple cache
                    var hash = {}, folders = {}, getKey = cache.defaultKeyGenerator;
                    _(ids).each(function (o) {
                        hash[getKey(o)] = true;
                        folders[o.folder_id] = true;
                    });
                    // loop over each folder and look for items to remove
                    _(folders).each(function (value, folder_id) {
                        caches.all.get(folder_id).done(function (items) {
                            if (items) {
                                caches.all.add(
                                    folder_id,
                                    _(items).select(function (o) {
                                        return hash[getKey(o)] !== true;
                                    })
                                );
                            }
                        });
                    });
                    // clear
                    hash = folders = null;
                    // remove from object caches
                    caches.list.remove(ids);
                    caches.get.remove(ids);
                    // trigger local refresh
                    api.trigger('deleted');
                    api.trigger('refresh.all');
                };
                api.trigger("beforedelete");
                // delete on server?
                if (local !== true) {
                    return http.PUT({
                        module: o.module,
                        params: opt,
                        data: http.simplify(ids),
                        appendColumns: false
                    })
                    .done(done);
                } else {
                    return $.Deferred().resolve().done(done);
                }
            },

            needsRefresh: function (folder) {
                // has entries in 'all' cache for specific folder
                return caches.all.contains(folder);
            },

            caches: caches
        };

        // add search?
        if (o.requests.search) {
            api.search = function (query, options) {
                // merge defaults for search
                var opt = $.extend({}, o.requests.search, options || {}),
                    getData = opt.getData;
                // remove getData functions
                delete opt.getData;
                // go!
                return http.PUT({
                    module: o.module,
                    params: opt,
                    data: getData(query)
                });
            };
        }

        Events.extend(api);

        // bind to global refresh
        ox.on("refresh", function () {
            if (ox.online) {
                // clear "all & list" caches
                api.caches.all.clear();
                api.caches.list.clear();
                // trigger local refresh
                api.trigger("refresh.all");
            }
        });

        return api;
    };

});
