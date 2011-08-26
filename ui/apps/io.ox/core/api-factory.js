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
        var clone = ox.util.clone(obj);
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
            keyGenerator: null, // = default (folder_id.id)
            // module
            module: "",
            // for all, list, and get
            requests: {
                all: { action: "all" },
                list: { action: "list" },
                get: { action: "get" },
                search: { action: "search" }
            }
        }, o || {});
        
        // use module as id?
        o.id = o.id || o.module;
        
        // create 3 caches for all, list, and get requests
        var caches = {
            all: new cache.SimpleCache(o.id + "-all", false),
            list: new cache.FlatCache(o.id + "-list", true, o.keyGenerator),
            get: new cache.FlatCache(o.id + "-get", true, o.keyGenerator)
        };
        
        return event.Dispatcher.extend({
            
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
                        caches.list.addArray(data);
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
                    });
                } else {
                    // cache hit
                    return $.Deferred().resolve(caches.get.get(opt));
                }
            },
            
            caches: caches
        });
    };
    
});