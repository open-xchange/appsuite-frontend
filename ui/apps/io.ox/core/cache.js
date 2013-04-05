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
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define('io.ox/core/cache',
    ["io.ox/core/extensions",
     "io.ox/core/cache/indexeddb",
     "io.ox/core/cache/localstorage",
     "io.ox/core/cache/simple"], function (ext) {

    'use strict';

    // default key generator
    var preferredPersistentCache = null,
        storages = {},
        defaultKeyGenerator = function (data) {
            if (typeof data === 'object' && data) {
                data = 'data' in data ? data.data : data;
                return (data.folder_id || data.folder || 0) + '.' + data.id;
            } else {
                return '';
            }
        };

    ox.cache = {
        clear: function () {
            return $.when.apply($,
                ext.point("io.ox/core/cache/storage").map(function (storage) {
                    return storage.clear && storage.isUsable() ? storage.clear() : $.when();
                })
            );
        }
    };

    ext.point("io.ox/core/cache/storage").each(function (storage) {
        if (storage.isUsable() && _.isNull(preferredPersistentCache)) {
            preferredPersistentCache = storage.id;
        }
        storages[storage.id] = storage;
    });

    // #!&cacheStorage=localstorage
    preferredPersistentCache = _.url.hash('cacheStorage') ? _.url.hash('cacheStorage') : preferredPersistentCache;

    /**
     *  @class CacheStorage
     */
    var CacheStorage = (function () {

        return function (name, persistent, options) {

            var opt = _.extend({
                    fluent: 'simple',
                    persistent: preferredPersistentCache
                }, options || {}),

                persistentCache = storages[opt.persistent],
                fluentCache = storages[opt.fluent],
                // use persistent storage?
                persist = (persistentCache.isUsable() && _.url.hash('persistence') !== 'false' && persistent === true ?
                        function () {
                            return ox.user !== '';
                        } :
                        function () {
                            return false;
                        }),

                // define id now; user & language should never change on-the-fly
                id = _(['appsuite.cache',  ox.user, ox.language, name || '']).compact().join('.'),

                getStorageLayer = function () {
                    var layer = null, instance;
                    if (persist()) {
                        layer = persistentCache;
                    } else {
                        layer = fluentCache;
                    }

                    instance = layer.getInstance(id);
                    return instance;
                };

            this.clear = function () {
                return getStorageLayer().clear();
            };

            this.get = function (key) {
                return getStorageLayer().get(key);
            };

            this.set = function (key, data) {
                return getStorageLayer().set(key, data);
            };

            this.remove = function (key) {
                return getStorageLayer().remove(key);
            };

            this.keys = function () {
                return getStorageLayer().keys();
            };
        };

    }());

    /**
     *  @class Simple Cache
     */
    var SimpleCache = function (name, persistent) {

        // private fields
        var index = new CacheStorage(name + '.index', persistent);

        var self = this;

        if (!name) {
            // not funny!
            throw 'Each object cache needs a unique name!';
        }

        // clear cache
        this.clear = function () {
            return index.clear();
        };

        this.add = function (key, data, timestamp) {
            // timestamp
            timestamp = timestamp !== undefined ? timestamp : _.now();
            // add/update?
            return index.get(key).pipe(function (getdata) {
                if (getdata !== null) {
                    if (timestamp >= getdata.timestamp) {
                        return index.set(key, {
                            data: data,
                            timestamp: timestamp
                        }).pipe(function () {
                            return data;
                        });
                    } else {
                        return getdata.data;
                    }
                } else {
                    return index.set(key, {
                        data: data,
                        timestamp: timestamp
                    }).pipe(function () {
                        return data;
                    });
                }
            });
        };

        // get from cache
        this.get = function (key, getter, readThroughHandler) {
            return index.get(key).pipe(function (o) {
                if (o !== null) {
                    if (readThroughHandler) { readThroughHandler(o.data); }
                    return o.data;
                } else {
                    return getter ? getter() : null;
                }
            });
        };

        // get timestamp of cached element
        this.time = function (key) {
            return index.get(key).pipe(function (o) {
                return o !== null ? o.timestamp : 0;
            });
        };

        // remove from cache (key|array of keys)
        this.remove = function (key) {
            // is array?
            if (_.isArray(key)) {
                var i = 0, $i = key.length, c = [];
                for (; i < $i; i++) {
                    c.push(index.remove(key[i]));
                }

                return $.when.apply(null, c);
            } else {
                return index.remove(key);
            }
        };

        // grep remove
        this.grepRemove = function (pattern) {
            var i = 0, $i = 0;
            if (typeof pattern === 'string') {
                pattern = new RegExp(_.escapeRegExp(pattern));
            }

            var remover = function (key) {
                if (pattern.test(key)) {
                    return index.remove(key);
                }
            };

            return index.keys().pipe(function (keys) {
                $i = keys.length;

                var c = [];
                for (; i < $i; i++) {
                    c.push(remover(keys[i]));
                }

                return $.when.apply(null, c);
            });
        };

        // list keys
        this.keys = function () {
            return index.keys();
        };

        // grep keys
        this.grepKeys = function (pattern) {
            return index.keys().done(function (keys) {
                var $i = keys.length, i = 0,
                    tmp = [], key;
                if (typeof pattern === 'string') {
                    pattern = new RegExp(_.escapeRegExp(pattern));
                }

                for (; i < $i; i++) {
                    key = keys[i];
                    if (pattern.test(key)) {
                        tmp.push(key);
                    }
                }
                return tmp;
            });
        };

        function getData(data) {
            return data && data.data ? data.data : null;
        }

        // list values
        this.values = function () {
            return index.keys().pipe(function (keys) {
                return $.when.apply($,
                    _(keys).map(function (key) { return index.get(key).pipe(getData); })
                )
                .pipe(function () {
                    return _(arguments).compact();
                });
            });
        };

        // get size
        this.size = function () {
            return index.keys().pipe(function (keys) {
                return keys.length;
            });
        };
    };

    /**
     *  @class Flat Cache
     */
    var ObjectCache = function (name, persistent, keyGenerator) {

        // inherit
        SimpleCache.call(this, name, persistent);

        // key generator
        this.keyGenerator = _.isFunction(keyGenerator) ? keyGenerator : defaultKeyGenerator;

        // get from cache
        var get = this.get;
        this.get = function (key, getter, readThroughHandler) {
            // array?
            if (_.isArray(key)) {

                var self = this, def = new $.Deferred();

                $.when.apply($,
                    _(key).map(function (o) {
                        return self.get(o);
                    })
                )
                .done(function () {
                    // contains null?
                    var args,
                        containsNull = _(arguments).reduce(function (memo, o) {
                            return memo || o === null;
                        }, false);
                    if (containsNull) {
                        if (getter) {
                            getter().then(def.resolve, def.reject);
                        } else {
                            def.resolve(null);
                        }
                    } else {
                        args = $.makeArray(arguments);
                        if (readThroughHandler) { readThroughHandler(args); }
                        def.resolve(args);
                    }
                });
                return def;
            } else {
                // simple value
                var tmpKey;
                if (typeof key === 'string' || typeof key === 'number') {
                    tmpKey = key;
                } else {
                    tmpKey = this.keyGenerator(key);
                }
                return get(tmpKey, getter, readThroughHandler);
            }
        };

        // add to cache
        var add = this.add;
        this.add = function (data, timestamp) {

            var key;
            if (_.isArray(data)) {
                timestamp = timestamp !== undefined ? timestamp : _.now();
                var i = 0, $i = data.length, self = this;

                var adder = function (data, timestamp) {
                    return self.add(data, timestamp).pipe(function () {
                        return self.keyGenerator(data);
                    });
                };
                var c = [];
                for (; i < $i; i++) {
                    c.push(adder(data[i], timestamp));
                }

                return $.when.apply($, c).pipe(function () {
                    return _(arguments).without(null);
                });
            } else {
                // get key
                key = String(this.keyGenerator(data));

                return add(key, data, timestamp).pipe(function (result) {
                    return key;
                });
            }
        };

        this.merge = function (data, timestamp) {
            var key, target, id, changed = false, self = this;


            if (_.isArray(data)) {
                timestamp = timestamp !== undefined ? timestamp : _.now();
                var i = 0, $i = data.length;

                var merger = function (check) {
                    changed = changed || check;
                };

                var c = [];
                for (; i < $i; i++) {
                    c.push(this.merge(data[i], timestamp).pipe(merger));
                }

                return $.when.apply(null, c).pipe(function () {
                    return changed;
                });
            } else {
                key = String(this.keyGenerator(data));
                return get(key).pipe(function (target) {
                    if (target !== null) {
                        var id;
                        for (id in target) {
                            if (data[id] !== undefined) {
                                changed = changed || !_.isEqual(target[id], data[id]);
                                target[id] = data[id];
                            }
                        }
                        if (changed) {
                            return self.add(target, timestamp).pipe(function (addReturn) {
                                return changed;
                            });
                        } else {
                            return changed;
                        }
                    } else {
                        return false;
                    }
                });
            }
        };

        var remove = this.remove;
        this.remove = function (data) {
            var def = new $.Deferred(), tmpGenerator = this.keyGenerator;

            var keygen = function (data) {
                // simple value
                if (typeof data === 'string' || typeof data === 'number') {
                    return data;
                } else {
                    // object, so get key
                    return String(tmpGenerator(data));
                }
            };

            if (_.isArray(data)) {
                var i = 0, $i = data.length, doneCounter = 0;

                var resolver = function () {
                    doneCounter++;
                    if (doneCounter === $i) {
                        def.resolve();
                    }
                };

                var remover = function (key) {
                    remove(keygen(key)).done(resolver).fail(resolver);
                };

                for (; i < $i; i++) {
                    remover(data[i]);
                }
            } else {
                remove(keygen(data)).done(def.resolve).fail(def.reject);
            }

            return def;
        };
    };

    // debug!
    window.dumpStorage = function () {
        var i = 0, $i = localStorage.length, key, value;
        for (; i < $i; i++) {
            // get key by index
            key = localStorage.key(i);
            try {
                value = JSON.parse(localStorage.getItem(key));
                console.debug('#', i, 'key', key, 'value', value);
            } catch (e) {
                console.error('key', key, e);
            }
        }
    };

    return {
        defaultKeyGenerator: defaultKeyGenerator,
        CacheStorage: CacheStorage,
        SimpleCache: SimpleCache,
        ObjectCache: ObjectCache
    };
});
