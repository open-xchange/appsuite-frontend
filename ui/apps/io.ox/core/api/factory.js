/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/factory', [
    'io.ox/core/http',
    'io.ox/core/cache',
    'io.ox/core/event',
    'io.ox/core/extensions',
    'io.ox/core/api/backbone'
], function (http, cache, Events, ext, backbone) {

    'use strict';

    var DELIM = '//';

    var fix = function (obj) {
        var clone = _.copy(obj, true);
        clone.folder = clone.folder || clone.folder_id;
        // to avoid trash in requests
        delete clone.folder_id;
        return clone;
    };

    var GET_IDS = 'id: folder_id:folder folder: recurrence_position:'.split(' ');

    /**
     * reduce object to id, folder, recurrence_position
     * @param  {object|string} obj
     * @return { object }
     */
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
            // ~ use default
            keyGenerator: null,
            // module
            module: '',
            //column mapping
            mapping: {},
            // for all, list, and get
            requests: {
                all: { action: 'all', timezone: 'utc' },
                list: { action: 'list', timezone: 'utc' },
                get: { action: 'get', timezone: 'utc' },
                search: { action: 'search', timezone: 'utc' },
                remove: { action: 'delete' }
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

        _.each(o.requests, function (request) {
            if (!request.extendColumns) return;
            request.columns = factory.extendColumns(request.extendColumns,
                o.module, request.columns);
            delete request.extendColumns;
        });

        // create 3 caches for all, list, and get requests
        var caches = {
            all: new cache.SimpleCache(o.id + '-all'),
            // no persistant cache for list, because burst-writes block read (stupid queue implementation)
            list: new cache.ObjectCache(o.id + '-list', false, o.keyGenerator),
            get: new cache.ObjectCache(o.id + '-get', false, o.keyGenerator)
        };

        // hash to track very first cache hit
        var readThrough = {};

        // track last_modified
        var lastModified = {};

        var api = {

            DELIM: DELIM,

            options: o,

            cid: o.cid,

            /**
             * requests data for all ids
             * @param  {object} options
             * @param  {boolean} useCache (default is true)
             * @param  {object} cache (default is cache.all)
             * @param  {boolean} processResponse (default is true)
             * @fires api#update: + id
             * @return { deferred }
             */
            getAll: function (options, useCache, cache, processResponse) {

                // merge defaults for 'all'
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
                    .then(function (data) {
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
                                    } else if (obj.last_modified > lastModified[cid]) {
                                        // do we see a newer item now?
                                        lastModified[cid] = obj.last_modified;
                                        return $.when(
                                            api.caches.list.remove(cid),
                                            api.caches.get.remove(cid)
                                        )
                                        .done(function () {
                                            api.trigger('update:' + _.ecid(obj), obj);
                                        });
                                    }
                                })
                            )
                            .then(function () { return data; });
                        } else {
                            return data;
                        }
                    }, function (error) {
                        api.trigger('error error:' +  error.code, error );
                        return error;
                    })
                    .then(function (data) {
                        return (o.pipe.all || _.identity)(data, opt);
                    })
                    .then(function (data) {
                        // add to cache
                        return $.when(cache.add(cid, data)).then(function () {
                            return data;
                        });
                    });
                };

                var hit = function () {
                    if (ox.serverConfig.persistence === false) return;
                    if (!(cid in readThrough)) {
                        readThrough[cid] = true;
                        setTimeout(function () {
                            api.refresh();
                        }, 5000);
                    }
                };

                return (useCache ? cache.get(cid, getter, hit) : getter())
                    .then(o.pipe.allPost)
                    .done(o.done.all || $.noop);
            },

            /**
             * requests data for multiple ids
             * @param  {array} ids
             * @param  {boolean} useCache (default is true)
             * @param  {object} options
             * @return { deferred }
             */
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
                    if (options.unseen) {
                        params.unseen = true;
                    }
                    return http.fixList(ids, http.PUT({
                        module: o.module,
                        params: params,
                        data: http.simplify(ids)
                    }))
                    .then(function (data) {
                        return (o.pipe.list || _.identity)(data);
                    })
                    .then(function (data) {
                        // add to cache
                        var method = options.allColumns ? 'add' : 'merge';
                        // merge with or add to 'get' cache
                        return $.when(caches.list.add(data), caches.get[method](data)).then(function () {
                            return data;
                        });
                    });
                };
                // empty?
                if (ids.length === 0) {
                    return $.Deferred().resolve([]).done(o.done.list || $.noop);
                // see Bug 32300 - Single contact does not get updated after external change
                // } else if (ids.length === 1) {

                //     // if just one item, we use get request
                //     if (typeof ids[0] === 'number') {
                //         ids = [{ id: ids[0]}];
                //     }

                //     var getOptions = http.simplify(ids)[0];

                //     //look if special handling is needed
                //     if (_.isFunction(o.simplify)) {
                //         getOptions = o.simplify({ original: ids[0], simplified: getOptions });
                //     }

                //     // go!
                //     return this.get(getOptions, useCache)
                //         .then(function (data) { return [data]; })
                //         .then(o.pipe.listPost)
                //         .done(o.done.list || $.noop);
                } else {
                    // cache miss?
                    return (useCache ? caches.list.get(ids, getter) : getter())
                        .then(o.pipe.listPost)
                        .done(o.done.list || $.noop);
                }
            },

            /**
             * requests data for a single id
             * @param  {object} options
             * @param  {boolan} useCache (default is true)
             * @fires api#refresh.list
             * @return { deferred} (resolve returns response)
             */
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
                    .then(function (data) {
                        return (o.pipe.get || _.identity)(data, opt);
                    }, function (error) {
                        api.trigger('error error:' +  error.code, error );
                        return error;
                    })
                    .then(function (data) {
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
                            ).then(function () {
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
                    .then(o.pipe.getPost)
                    .done(o.done.get || $.noop);
            },

            /**
             * remove elements from list
             * @param  {array} list
             * @param  {object} hash (ids of items to be removed)
             * @param  {function} getKey
             * @return { array} (cleaned list)
             */
            localRemove: function (list, hash, getKey) {
                return _(list).filter(function (o) {
                    return hash[getKey(o)] !== true;
                });
            },

            /**
             * update or invalidates all, list and get cache
             * @param  {array|object} ids
             * @param  {boolean} silent (do not fire events)
             * @fires  api#delete: + id
             * @return { promise} jQueries deferred promise
             */
            updateCaches: function (ids, silent) {
                // be robust
                ids = ids || [];
                ids = _.isArray(ids) ? ids : [ids];

                // find affected mails in simple cache
                var hash = {},
                    folders = {},
                    getKey = cache.defaultKeyGenerator,
                    defs;

                _(ids).each(function (o) {
                    hash[getKey(o)] = folders[o.folder_id] = true;
                });

                if (ids.length < 100) {
                    // loop over each folder and look for items to remove
                    defs = _(folders).map(function (value, folder_id) {
                        // grep keys
                        var cache = api.caches.all;
                        return cache.grepKeys(folder_id + DELIM).then(function (keys) {
                            // loop
                            return $.when.apply($, _(keys).map(function (key) {
                                // now get cache entry
                                return cache.get(key).then(function (data) {
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
                } else {
                    // clear allcache due to performace
                    defs = [api.caches.all.clear()];
                    // remove from object caches
                    if (ids.length) {
                        defs.push(api.caches.list.clear());
                        defs.push(api.caches.get.clear());
                    }
                }

                // reset trash?
                if (api.resetTrashFolders) {
                    defs.push(api.resetTrashFolders());
                }
                // clear
                return $.when.apply($, defs).done(function () {
                    // trigger item specific events to be responsive
                    if (!silent) {
                        _(ids).each(function (obj) {
                            api.trigger('delete:' + _.ecid(obj));
                        });
                    }
                    hash = folders = defs = ids = null;
                });
            },

            /**
             * remove ids from
             * @param  {array|object} ids
             * @param  {Object} options (local: only locally, force: force delete)
             * @fires  api#refresh.all
             * @fires  api#delete (ids)
             * @fires  api#beforedelete (ids)
             * @fires  api#refresh:all:local
             * @return { deferred }
             */
            remove: function (ids, options) {
                // be robust
                ids = ids || [];
                ids = _.isArray(ids) ? ids : [ids];
                options = _.extend({ local: false, force: false }, options || {});
                var opt = $.extend({}, o.requests.remove, { timestamp: _.then() }),
                    data = http.simplify(ids);
                // force?
                if (options.force) {
                    opt.harddelete = true;
                }
                // update folder
                var update = function (result) {
                    // remove affected folder from cache
                    var folders = {};
                    _(ids).each(function (o) { folders[o.folder_id] = o.folder_id; });
                    return $.when.apply(
                        $, _(folders).map(function (id) {
                            return api.caches.all.grepRemove(id + DELIM);
                        })
                    )
                    .then(function () {
                        return $.Deferred()[result.error ? 'reject' : 'resolve'](result);
                    });
                };
                // done
                var done = function () {
                    api.trigger('refresh.all');
                    api.trigger('delete', ids);
                };
                api.trigger('beforedelete', ids);
                // remove from caches first
                return api.updateCaches(ids).then(function () {
                    // trigger visual refresh
                    api.trigger('refresh:all:local');
                    // delete on server?
                    if (options.local !== true) {
                        return http.PUT({
                            module: o.module,
                            params: opt,
                            data: data,
                            appendColumns: false
                        })
                        .then(update, update)
                        .always(done);
                    } else {
                        return done();
                    }
                });
            },

            /**
             * has entries in 'all' cache for specific folder
             * @param  {string} folder (id)
             * @param  {string} sort   (column)
             * @param  {string} order
             * @return { deferred}      (resolves returns boolean)
             */
            needsRefresh: function (folder, sort, order) {
                return caches.all.keys(folder + DELIM + sort + '.' + order).then(function (data) {
                    return data !== null;
                });
            },

            reduce: reduce,

            caches: caches
        };

        /**
         * columns ids or names specified by id (example: 'email' fields from 'contacts' )
         * @param  {string} id
         * @param  {string} format ('ids', 'names')
         * @example getMapping('cellular') of contactsAPI returns ['551', '552']
         * @return { array} list of columnids or names
         */
        api.getMapping = function (id, format) {
            //columns ids or names
            format = format || 'ids';
            //get ids
            var names,
                mappings = o.mapping[id] || [],
                columns = [].concat(_.clone(mappings));
            //map columnids to columnnames
            if (format === 'names') {
                names = http.getColumnMapping(o.module);
                columns = _.map(columns, function (id) {
                    return names[id];
                });
            }
            return columns;
        };

        // add search?
        if (o.requests.search) {
            /**
             * search
             * @param  {string} query   [description]
             * @param  {object} options
             * @return { deferred }
             */
            api.search = function (query, options) {

                // merge defaults for search
                var opt = $.extend({}, o.requests.search, options || {}), list,
                    getData = opt.getData;

                options = options || {};

                if (o.requests.search.omitFolder && options.omitFolder !== false) {
                    delete opt.folder;
                }

                // remove omitFolder & getData functions
                delete opt.omitFolder;
                delete opt.getData;

                //add extra fields via keywords defined in extra property
                if (opt.extra && opt.extra.length) {
                    list = [].concat(opt.columns);
                    _.each(opt.extra, function (id) {
                        list = list.concat(api.getMapping(id));
                    });
                    opt.columns = _.uniq(list).join(',');
                }
                delete opt.extra;

                // go!
                return http.PUT({
                    module: o.module,
                    params: opt,
                    data: getData(query, options)
                })
                .then(function (data) {
                    return (o.pipe.search || _.identity)(data);
                });
            };
        }

        // add advancedsearch?
        if (o.requests.advancedsearch) {
            /**
             * advancedsearch
             * @param  {string} query   [description]
             * @param  {object} options
             * @return { deferred }
             */
            api.advancedsearch = function (query, options) {

                // merge defaults for search
                var opt = $.extend({}, o.requests.advancedsearch, options || {}),
                    getData = opt.getData;

                options = options || {};

                if (o.requests.advancedsearch.omitFolder && options.omitFolder !== false) {
                    delete opt.folder;
                }

                // remove omitFolder & getData functions
                delete opt.omitFolder;
                delete opt.getData;

                // go!
                return http.PUT({
                    module: o.module,
                    params: opt,
                    data: getData(query, options)
                })
                .then(function (data) {
                    // make sure we always have the same response
                    return data;
                });
            };
        }

        Events.extend(api);

        /**
         * bind to global refresh; clears caches and trigger refresh.all
         * @fires api#refresh.all
         * @return { promise }
         */
        api.refresh = function () {
            if (ox.online) {
                // clear 'all & list' caches
                return $.when(
                    api.caches.all.clear(),
                    api.caches.list.clear()
                ).done(function () {
                    // trigger local refresh
                    api.trigger('refresh.all');
                });
            } else {
                return $.when();
            }
        };

        ox.on('refresh^', function () {
            // write it this way so that API's can overwrite refresh
            api.refresh();
        });

        // basic model with custom cid / collection using custom models
        api.Model = backbone.Model;
        api.Collection = backbone.Collection;

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
        // avoid duplication by using a hash instead of an array
        var hash = {},
            // a map from field names to column IDs
            cols = {},
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
