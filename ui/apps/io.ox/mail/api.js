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

define("io.ox/mail/api", ["io.ox/core/cache"], function (cache) {
    
    var cache = {
        all: new cache.FlatCache("mailAll", false),
        list: new cache.FlatCache("mailList", true),
        full: new cache.FlatCache("mailFull", true)
    };
    
    // simple temporary thread cache
    var threads = {};
    
    // helper: get number of mails in thread
    var threadSize = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return (threads[key] || []).length;
    };
    
    // helper: sort by received date
    var dateSort = function (a, b) {
        return b.received_date - a.received_date;
    };
    
    return ox.api.mail = {
        
        get: function (options) {
            
            var o = $.extend({
                folder: "6",
                id: 0
            }, options);
            
            if (o.folder_id) {
                o.folder = o.folder_id;
            }
            
            var key = { folder_id: o.folder, id: o.id };
            
            // contains?
            if (!cache.full.contains(key)) {
                // cache miss
                return ox.api.http.GET({
                    module: "mail",
                    params: {
                        action: "get",
                        folder: o.folder,
                        id: o.id,
                        view: "text",
                        unseen: true
                    }
                })
                .done(function (data) {
                    cache.full.add(data);
                });
            } else {
                // cache hit
                return $.Deferred().resolve(cache.full.get(key));
            }
        },
        
        // ~ all
        getAllThreads: function (options) {
            
            var def = $.Deferred();
            
            options = options || {};
            options.columns = "601,600,610,612"; // +level, +received_date
            options.sort = "thread";
            
            this.getAll(options)
            .done(function (data) {
                // loop over data
                var i = 0, obj, tmp = null, all = [], first;
                for (; obj = data[i]; i++) {
                    if (obj.level === 0) {
                        if (tmp) {
                            // sort
                            tmp.sort(dateSort);
                            // add most recent element to list
                            all.push(first = tmp[0]);
                            // add to hash
                            threads[first.folder_id + "." + first.id] = tmp;
                        }
                        // clear
                        tmp = [obj];
                    } else {
                        tmp.push(obj);
                    }
                }
                // resort all
                all.sort(dateSort);
                def.resolve(all);
            })
            .fail(def.reject);
            
            return def;
        },
        
        // get mails in thread
        getThread: function (obj) {
            var key = obj.folder_id + "." + obj.id;
            return threads[key] || [obj];
        },
        
        // ~ get
        getFullThread: function (obj) {
            // get list of IDs
            var key = obj.folder_id + "." + obj.id,
                thread = threads[key] || [obj],
                defs = [],
                self = this;
            // get each mail
            $.each(thread, function (i) {
                defs.push(self.get(thread[i]));
            });
            // join all deferred objects
            var result = $.Deferred();
            $.when.apply($, defs).done(function () {
                var args = $.makeArray(arguments), tmp = [];
                args = defs.length > 1 ? args : [args];
                // loop over results
                $.each(args, function (i) {
                    tmp.push(args[i][0] || args[i]);
                });
                // resolve
                result.resolve(tmp);
            });
            return result;
        },
        
        // ~ list
        getThreads: function (ids) {
            
            var def = $.Deferred();
            
            this.getList(ids)
            .done(function (data) {
                // clone not to mess up with searches
                data = ox.util.clone(data);
                // inject thread size
                var i = 0, obj;
                for (; obj = data[i]; i++) {
                    obj.threadSize = threadSize(obj);
                }
                def.resolve(data);
            })
            .fail(def.reject);
            
            return def;
        },
        
        getAll: function (options) {
            
            var o = $.extend({
                folder: "default0/INBOX",
                columns: "601,600",
                sort: "610", // received_date
                order: "desc"
            }, options);
            
            return ox.api.http.GET({
                module: "mail",
                params: {
                    action: "all",
                    folder: o.folder,
                    columns: o.columns,
                    sort: o.sort,
                    order: o.order
                }
            });
        },
        
        getList: function (ids) {
            // be robust
            ids = ids || [];
            // contains?
            if (!cache.list.contains(ids)) {
                // cache miss
                return ox.api.http.fixList(ids, ox.api.http.PUT({
                    module: "mail",
                    params: {
                        action: "list",
                        columns: "601,600,603,607,610,611"
                    },
                    data: ox.api.http.simplify(ids)
                }))
                .done(function (data) {
                    cache.list.addArray(data);
                });
            } else {
                // cache hit
                return $.Deferred().resolve(cache.list.get(ids));
            }
        },
        
        search: function (query) {
            // search via pattern
            return ox.api.http.PUT({
                module: "mail",
                params: {
                    action: "search",
                    folder: "default0/INBOX",
                    columns: "601,600",
                    sort: "610",
                    order: "desc"
                },
                data: [
                    { col: 603, pattern: query }, // from
                    { col: 607, pattern: query } // subject
                ]
            });
        },
        
        cache: cache
    };
});