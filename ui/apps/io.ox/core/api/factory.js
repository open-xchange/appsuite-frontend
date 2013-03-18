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

define('io.ox/core/api/factory',
    ['io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/event',
     'io.ox/core/extensions'], function (http, cache, Events, ext) {

    "use strict";

    var DELIM = '//';

    var fix = function (obj) {
        var clone = _.copy(obj, true);
        clone.folder = clone.folder || clone.folder_id;
        delete clone.folder_id; // to avoid trash in requests
        return clone;
    };

    var GET_IDS = 'id: folder_id:folder folder: recurrence_position:'.split(' ');

    // reduce object to id, folder, recurrence_position
    var reduce = function (obj) {
        return !_.isObject(obj) ? obj : _(GET_IDS).reduce(function (memo, prop) {
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
                all: { action: "all", timezone: 'utc' },
                list: { action: "list", timezone: 'utc' },
                get: { action: "get", timezone: 'utc' },
                search: { action: "search", timezone: 'utc' },
                remove: { action: "delete" }
            },
            cid: function (o) {
                return o.folder + DELIM + (o.sortKey || o.sort) + '.' + o.order + '.' + (o.max || o.limit || 0);
            },
            done: {},
            fail: {},
            pipe: {},
            params: {},
            filter: null
        }, o || {});

        // use module as id?
        o.id = o.id || o.module;
        
        _.each(o.requests, function (request, action) {
            if (!request.extendColumns) return;
            request.columns = factory.extendColumns(request.extendColumns,
                o.module, request.columns);
            delete request.extendColumns;
        });
        
        // create 3 caches for all, list, and get requests
        var caches = {
            all: new cache.SimpleCache(o.id + "-all", true),
            list: new cache.ObjectCache(o.id + "-list", true, o.keyGenerator),
            get: new cache.ObjectCache(o.id + "-get", true, o.keyGenerator)
        };

        // hash to track very first cache hit
        var readThrough = {};

        // track last_modified
        var lastModified = {};

        var api = {

            DELIM: DELIM,

            options: o,

            cid: o.cid,

            getAll: function (options, useCache, cache, processResponse) {

                // merge defaults for "all"
                var opt = $.extend({}, o.requests.all, options || {}),
                    cid = o.cid(opt);

                // use cache?
                useCache = useCache === undefined ? true : !!useCache;
                cache = cache || caches.all;

                // cache miss?
                var getter = function () {
                    var params = o.params.all ? o.params.all(_.copy(opt, true)) : opt;
                    return http.GET({
                        module: o.module,
                        params: params,
                        processResponse: processResponse === undefined ? true : processResponse
                    })
                    .pipe(function (data) {
                        // deferred
                        var ready = $.when();
                        // do we have the last_modified columns?
                        if (/(^5,|,5,|5$)/.test(params.columns)) {
                            return $.when.apply($,
                                _(data).map(function (obj) {
                                    var cid = _.cid(obj);
                                    // do we see this item for the first time?
                                    if (lastModified[cid] === undefined) {
                                        lastModified[cid] = obj.last_modified;
                                        return ready;
                                    }
                                    // do we see a newer item now?
                                    else if (obj.last_modified > lastModified[cid]) {
                                        lastModified[cid] = obj.last_modified;
                                        return $.when(
                                            api.caches.list.remove(cid),
                                            api.caches.get.remove(cid)
                                        )
                                        .done(function () {
                                            api.trigger('update:' + encodeURIComponent(cid), obj);
                                        });
                                    }
                                })
                            )
                            .pipe(function () { return data; });
                        } else {
                            return data;
                        }
                    })
                    .pipe(function (data) {
                        return (o.pipe.all || _.identity)(data, opt);
                    })
                    .pipe(function (data) {
                        // add to cache
                        return $.when(cache.add(cid, data)).pipe(function () {
                            return data;
                        });
                    });
                };

                var hit = function (data) {
                    if (!(cid in readThrough)) {
                        readThrough[cid] = true;
                        setTimeout(function () {
                            api.refresh();
                        }, 5000); // wait some secs
                    }
                };

                return (useCache ? cache.get(cid, getter, hit) : getter())
                    .pipe(o.pipe.allPost)
                    .done(o.done.all || $.noop);
            },

            getList: function (ids, useCache, options) {
                // be robust
                ids = ids ? [].concat(ids) : [];
                // custom filter
                if (o.filter) { ids = _(ids).filter(o.filter); }
                // use cache?
                options = options || {};
                useCache = useCache === undefined ? true : !!useCache;
                // async getter
                var getter = function () {
                    var params = _.extend({}, o.requests.list);
                    if (options.allColumns) {
                        params.columns = http.getAllColumns(o.module, true);
                    }
                    return http.fixList(ids, http.PUT({
                        module: o.module,
                        params: params,
                        data: http.simplify(ids)
                    }))
                    .pipe(function (data) {
                        return (o.pipe.list || _.identity)(data);
                    })
                    .pipe(function (data) {
                        // add to cache
                        var method = options.allColumns ? 'add' : 'merge';
                        // merge with or add to "get" cache
                        return $.when(caches.list.add(data), caches.get[method](data)).pipe(function () {
                            return data;
                        });
                    });
                };
                // empty?
                if (ids.length === 0) {
                    return $.Deferred().resolve([]).done(o.done.list || $.noop);
                } else if (ids.length === 1) {
                    // if just one item, we use get request
                    if (typeof ids[0] === 'number') {
                        ids = [{id: ids[0]}];
                    }
                    return this.get(http.simplify(ids)[0])
                        .pipe(function (data) { return [data]; })
                        .pipe(o.pipe.listPost)
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
                    .pipe(function (data) {
                        // use cache?
                        if (useCache) {
                            // add to cache
                            return $.when(
                                caches.get.add(data),
                                caches.list.merge(data).done(function (ok) {
                                    if (ok) {
                                        api.trigger('refresh.list');
                                    }
                                })
                            ).pipe(function () {
                                return data;
                            });
                        } else {
                            return data;
                        }
                    })
                    .fail(function (e) {
                        _.call(o.fail.get, e, opt, o);
                    });
                };
                return (useCache ? caches.get.get(opt, getter, o.pipe.getCache) : getter())
                    .pipe(o.pipe.getPost)
                    .done(o.done.get || $.noop);
            },

            localRemove: function (list, hash, getKey) {
                return _(list).filter(function (o) {
                    return hash[getKey(o)] !== true;
                });
            },

            updateCaches: function (ids, silent) {
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
                    var cache = api.caches.all;
                    return cache.grepKeys(folder_id + DELIM).pipe(function (keys) {
                        // loop
                        return $.when.apply($, _(keys).map(function (key) {
                            // now get cache entry
                            return cache.get(key).pipe(function (data) {
                                if (data) {
                                    if ('data' in data) {
                                        data.data = api.localRemove(data.data, hash, getKey);
                                    } else {
                                        data = api.localRemove(data, hash, getKey);
                                    }
                                    return cache.add(key, data);
                                } else {
                                    return $.when();
                                }
                            });
                        }));
                    });
                });
                // remove from object caches
                if (ids.length) {
                    defs.push(api.caches.list.remove(ids));
                    defs.push(api.caches.get.remove(ids));
                }
                // clear
                return $.when.apply($, defs).done(function () {
                    // trigger item specific events to be responsive
                    if (!silent) {
                        _(ids).each(function (obj) {
                            api.trigger('delete:' + encodeURIComponent(_.cid(obj)));
                        });
                    }
                    hash = folders = defs = ids = null;
                });
            },

            remove: function (ids, local) {
                // be robust
                ids = ids || [];
                ids = _.isArray(ids) ? ids : [ids];
                var opt = $.extend({}, o.requests.remove, { timestamp: _.now() }),
                    data = http.simplify(ids);
                // done
                var done = function () {
                    api.trigger('refresh.all');
                    api.trigger('delete', ids);
                };
                api.trigger('beforedelete', ids);
                // remove from caches first
                return api.updateCaches(ids).pipe(function () {
                    // trigger visual refresh
                    api.trigger('refresh:all:local');
                    // delete on server?
                    if (local !== true) {
                        return http.PUT({
                            module: o.module,
                            params: opt,
                            data: data,
                            appendColumns: false
                        })
                        .pipe(function () {
                            // remove affected folder from cache
                            var folders = {};
                            _(ids).each(function (o) { folders[o.folder_id] = o.folder_id; });
                            return $.when.apply($, _(folders).map(function (id) {
                                return api.caches.all.grepRemove(id + DELIM);
                            }));
                        })
                        .done(done);
                    } else {
                        return done();
                    }
                });
            },

            needsRefresh: function (folder, sort, desc) {
                // has entries in 'all' cache for specific folder
                return caches.all.keys(folder + DELIM + sort + '.' + desc).pipe(function (data) {
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
                    data: getData(query, options)
                });
            };
        }

        Events.extend(api);

        // bind to global refresh
        api.refresh = function () {
            if (ox.online) {
                // clear "all & list" caches
                return $.when(
                    api.caches.all.clear(),
                    api.caches.list.clear()
                ).done(function () {
                    // trigger local refresh
                    api.trigger("refresh.all");
                });
            } else {
                return $.when();
            }
        };

        ox.on('refresh^', function () {
            api.refresh(); // write it this way so that API's can overwrite refresh
        });

        return api;
    };

    factory.reduce = reduce;
    
    /**
     * Extends a columns parameter using an extension point.
     * The columns parameter is a comma-separated list of (usually numeric)
     * column IDs. The extension point must provide a method 'columns' which
     * returns an array of field names or column IDs to add.
     * @param id {string} The name of the extension point.
     * @param module {string} The module used to map columns to field names.
     * @param columns {string} The initial value of the columns parameter.
     * @returns {string} The extended columns parameter.
     */
    factory.extendColumns = function (id, module, columns) {
        var hash = {}, // avoid duplication by using a hash instead of an array
            
            cols = {}, // a map from field names to column IDs
            // http has only the reverse version of what we need
            fields = http.getColumnMapping(module);
        _.each(fields, function (field, col) { cols[field] = col; });

        _.each(columns.split(','), function (col) { hash[col] = 1; });

        _.chain(ext.point(id).invoke('columns')).flatten(true)
            .each(function (field) { hash[cols[field] || field] = 1; });

        return _.keys(hash).join();
    };

    return factory;
});
