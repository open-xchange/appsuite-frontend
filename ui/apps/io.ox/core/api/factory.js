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
        var clone = _.copy(obj, true);
        clone.folder = clone.folder || clone.folder_id;
        return clone;
    };

    var GET_IDS = 'id: folder_id:folder folder: recurrence_position:'.split(' ');

    // reduce object to id, folder, recurrence_position
    var reduce = function (obj) {
        return !obj ? obj : _(GET_IDS).reduce(function (memo, prop) {
            var p = prop.split(':'), source = p[0], target = p[1] || p[0];
            if (source in obj) { memo[target] = obj[source]; }
            return memo;
        }, {});
    };

    var factory = function (o) {

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
            done: {},
            fail: {},
            pipe: {},
            filter: null
        }, o || {});

        // use module as id?
        o.id = o.id || o.module;

        // create 3 caches for all, list, and get requests
        var caches = {
            all: new cache.SimpleCache(o.id + "-all", true),
            list: new cache.ObjectCache(o.id + "-list", true, o.keyGenerator),
            get: new cache.ObjectCache(o.id + "-get", true, o.keyGenerator)
        };

        // hash to track very first cache hit
        var readThrough = {};

        var api = {

            getAll: function (options, useCache, cache, processResponse) {

                // merge defaults for "all"
                var opt = $.extend({}, o.requests.all, options || {}),
                    cid = opt.folder + '\t' + (opt.sortKey || opt.sort) + '.' + opt.order + '.' + (opt.max || opt.limit || 0);

                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                cache = cache || caches.all;

                // cache miss?
                var getter = function () {
                    return http.GET({
                        module: o.module,
                        params: opt,
                        processResponse: processResponse === undefined ? true : processResponse
                    })
                    .pipe(function (data) {
                        return (o.pipe.all || _.identity)(data, opt);
                    })
                    .done(function (data) {
                        // add to cache
                        cache.add(cid, data);
                    });
                };

                var hit = function (data) {
                    if (!(cid in readThrough)) {
                        readThrough[cid] = true;
                        setTimeout(function () {
                            api.refresh();
                        }, 3000); // wait some secs
                    }
                };

                return (useCache ? cache.get(cid, getter, hit) : getter())
                    .pipe(o.pipe.allPost)
                    .done(o.done.all || $.noop);
            },

            getList: function (ids, useCache) {
                // be robust
                ids = ids ? [].concat(ids) : [];
                // filter
                if (o.filter) { ids = _(ids).filter(o.filter); }
                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                // async getter
                var getter = function () {
                    return http.fixList(ids, http.PUT({
                        module: o.module,
                        params: o.requests.list,
                        data: http.simplify(ids)
                    }))
                    .pipe(function (data) {
                        return (o.pipe.list || _.identity)(data);
                    })
                    .done(function (data) {
                        // add to cache
                        caches.list.add(data);
                        // merge with "get" cache
                        caches.get.merge(data);
                    });
                };
                // empty?
                if (ids.length === 0) {
                    return $.Deferred().resolve([])
                        .done(o.done.list || $.noop);
                } else {
                    // cache miss?
                    return (useCache ? caches.list.get(ids, getter) : getter())
                        .pipe(o.pipe.listPost)
                        .done(o.done.list || $.noop);
                }
            },

            get: function (options, useCache) {
                // merge defaults for get
                var opt = $.extend({}, o.requests.get, options);
                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                // cache miss?
                var getter = function () {
                    return http.GET({
                        module: o.module,
                        params: fix(opt)
                    })
                    .pipe(function (data) {
                        return (o.pipe.get || _.identity)(data, opt);
                    })
                    .done(function (data) {
                        // use cache?
                        if (useCache) {
                            // add to cache
                            caches.get.add(data);
                            // update list cache
                            caches.list.merge(data).done(function (ok) {
                                if (ok) {
                                    api.trigger("refresh.list", data);
                                }
                            });
                        } else {
                            api.trigger("refresh.list", data);
                        }
                    })
                    .fail(function (e) {
                        _.call(o.fail.get, e, opt, o);
                    });
                };

                return (useCache ? caches.get.get(opt, getter) : getter())
                    .pipe(o.pipe.getPost)
                    .done(o.done.get || $.noop);
            },

            updateCachesAfterRemove: function (ids) {
                // be robust
                ids = ids || [];
                ids = _.isArray(ids) ? ids : [ids];
                // find affected mails in simple cache
                var hash = {}, folders = {}, getKey = cache.defaultKeyGenerator;
                _(ids).each(function (o) {
                    hash[getKey(o)] = folders[o.folder_id] = true;
                });
                // loop over each folder and look for items to remove
                var defs = _(folders).map(function (value, folder_id) {
                    // grep keys
                    var cache = caches.all;
                    return cache.grepKeys(folder_id + '\t').pipe(function (key) {
                        // now get cache entry
                        return cache.get(key).pipe(function (data) {
                            if (data) {
                                if ('data' in data) {
                                    data.data = _(data.data).filter(function (o) {
                                        return hash[getKey(o)] !== true;
                                    });
                                } else {
                                    data = _(data).filter(function (o) {
                                        return hash[getKey(o)] !== true;
                                    });
                                }
                                return cache.add(key, data);
                            } else {
                                return $.when();
                            }
                        });
                    });
                });
                // remove from object caches
                if (ids.length) {
                    defs.push(caches.list.remove(ids));
                    defs.push(caches.get.remove(ids));
                }
                // clear
                return $.when.apply($, defs).done(function () {
                    hash = folders = defs = null;
                });
            },

            prepareRemove: function (ids) {
                return $.when();
            },

            remove: function (ids, local) {
                // be robust
                ids = ids || [];
                ids = _.isArray(ids) ? ids : [ids];
                var opt = $.extend({}, o.requests.remove, { timestamp: _.now() }),
                    data = http.simplify(ids);
                // done
                var done = function () {
                    api.trigger('delete', ids);
                };
                api.trigger('beforedelete', ids);
                return api.prepareRemove(ids).pipe(function () {
                    // remove from caches first
                    return api.updateCachesAfterRemove(ids).pipe(function () {
                        
                        // delete on server?
                        if (local !== true) {
                            
                            return http.PUT({
                                module: o.module,
                                params: opt,
                                data: data,
                                appendColumns: false
                            })
                            .done(function () {
                                // refresh needs to be done after delete or the all request may still get data from the deleted object
                                api.trigger('refresh.all');
                                done();
                            });
                        } else {
                            // trigger refresh now
                            api.trigger('refresh.all');
                            return done();
                        }
                    });
                });
            },

            needsRefresh: function (folder, sort, desc) {
                // has entries in 'all' cache for specific folder
                return caches.all.keys(folder + '\t' + sort + '.' + desc).pipe(function (data) {
                    return data !== null;
                });
            },

            reduce: reduce,

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
        api.refresh = function () {
            if (ox.online) {
                // clear "all & list" caches
                api.caches.all.clear();
                api.caches.list.clear();
                // trigger local refresh
                api.trigger("refresh.all");
            }
        };

        ox.on('refresh^', function () {
            api.refresh(); // write it this way so that API's can overwrite refresh
        });

        return api;
    };

    factory.reduce = reduce;

    return factory;
});
