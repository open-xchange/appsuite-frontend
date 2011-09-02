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

define("io.ox/core/api-factory", ["io.ox/core/http", "io.ox/core/cache", "io.ox/core/event"], function (http, cache, event) {
    
    var fix = function (obj) {
        var clone = _.deepClone(obj);
        clone.folder = clone.folder || clone.folder_id;
        return clone;
    };
    
    return function (o) {
        
        // extend default options (deep)
        o = $.extend(true, {
            // use cache
            cache: true,
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
            }
        }, o || {});
        
        // use module as id?
        o.id = o.id || o.module;
        
        // create 3 caches for all, list, and get requests
        var caches = {
            all: new cache.SimpleCache(o.id + "-all", false),
            list: new cache.ObjectCache(o.id + "-list", true, o.keyGenerator),
            get: new cache.ObjectCache(o.id + "-get", true, o.keyGenerator)
        };
        
        var api = {
            
            getAll: function (options) {
                // merge defaults for "all"
                var opt = $.extend({}, o.requests.all, options || {});
                // cache miss?
                if (!o.cache || !caches.all.contains(opt.folder)) {
                    // call server and return deferred object
                    // TODO: special sort/order key stuff
                    return http.GET({
                        module: o.module,
                        params: opt
                    })
                    .done(function (data, timestamp) {
                        // add to cache
                        caches.all.add(opt.folder, data, timestamp);
                    });
                } else {
                    // cache hit
                    return $.Deferred().resolve(caches.all.get(opt.folder));
                }
            },
            
            getList: function (ids) {
                // be robust
                ids = ids || [];
                // cache miss?
                if (!o.cache || !caches.list.contains(ids)) {
                    // call server and return deferred object
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
                } else {
                    // cache hit
                    return $.Deferred().resolve(caches.list.get(ids));
                }
            },
            
            get: function (options) {
                // merge defaults for get
                var opt = $.extend({}, o.requests.get, options || {});
                // cache miss?
                if (!o.cache || !caches.get.contains(opt)) {
                    // call server and return deferred object
                    return http.GET({
                        module: o.module,
                        params: fix(opt)
                    })
                    .done(function (data, timestamp) {
                        // add to cache
                        caches.get.add(data, timestamp);
                        // update list cache
                        if (caches.list.merge(data)) {
                            // trigger local event
                            api.trigger("refresh.list", data);
                        }
                    });
                } else {
                    // cache hit
                    return $.Deferred().resolve(caches.get.get(opt));
                }
            },
            
            remove: function (ids) {
                // be robust
                ids = ids || [];
                var opt = $.extend({}, o.requests.remove, { timestamp: _.now() });
                // delete on server
                return http.PUT({
                    module: o.module,
                    params: opt,
                    data: http.simplify(ids),
                    appendColumns: false
                })
                .done(function () {
                    // find affected mails in simple cache
                    var hash = {}, folders = {}, getKey = cache.defaultKeyGenerator;
                    _(ids).each(function (o) {
                        hash[getKey(o)] = true;
                        folders[o.folder_id] = true;
                    });
                    // loop over each folder and look for items to remove
                    _(folders).each(function (value, folder_id) {
                        var items = caches.all.get(folder_id);
                        if (items) {
                            caches.all.add(
                                folder_id,
                                _(items).select(function (o) {
                                    return hash[getKey(o)] !== true;
                                })
                            );
                        }
                    });
                    // clear
                    hash = folders = null;
                    // remove from object caches
                    caches.list.remove(ids);
                    caches.get.remove(ids);
                    // trigger local refresh
                    api.trigger("refresh.all");
                });
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
                delete opt.data;
                // go!
                return http.PUT({
                    module: o.module,
                    params: opt,
                    data: getData(query)
                });
            };
        }
        
        event.Dispatcher.extend(api);
        
        // bind to global refresh
        ox.bind("refresh", function () {
            // clear "all & list" caches
            api.caches.all.clear();
            api.caches.list.clear();
            // trigger local refresh
            api.trigger("refresh.all");
        });
        
        return api;
    };
    
});