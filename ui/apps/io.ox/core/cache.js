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

define('io.ox/core/cache', function () {

    'use strict';

    // default key generator
    var defaultKeyGenerator = function (data) {
        if (typeof data === 'object' && data) {
            return (data.folder_id || data.folder || 0) + '.' + data.id;
        } else {
            return '';
        }
    };

    /**
     *  @class CacheStorage
     */

    var CacheStorage = (function () {

        return function (name, persistent, options) {

            var opt = _.extend({
                    fluent: 'simple',
                    persistent: 'localstorage'
                }, options || {}),

                persitentCache = require('io.ox/core/cache/' + opt.persistent),
                fluentCache = require('io.ox/core/cache/' + opt.fluent),
                id,
                // use persistent storage?
                persist = (persitentCache.isUsable() && _.url.hash('persistence') !== 'false' && persistent === true ?
                        function () {
                            if (ox.user !== '') {
                                id = 'cache.' + (ox.user || '_') + '.' + (name || '');
                                persist = function () {
                                    return true;
                                };
                                return true;
                            } else {
                                return false;
                            }
                        } :
                        function () {
                            return false;
                        }),

                getStorageLayer = function () {
                    var layer = null;
                    if (persist()) {
                        layer = persitentCache;
                    } else {
                        layer = fluentCache;
                    }
                    layer.setId(id);

                    return layer;
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

            this.contains = function (key) {
                return getStorageLayer().contains(key);
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
                var type = (_(getdata).isUndefined()) ? 'add modify *' : 'update modify *';

                if (!_(getdata).isUndefined()) {
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
        this.get = function (key) {
            return index.get(key).pipe(function (data) {
                return data !== undefined ? data.data : undefined;
            });
        };

        // get timestamp of cached element
        this.time = function (key) {
            return index.get(key).pipe(function (data) {
                if (!_(data).isUndefined()) {
                    return data.timestamp;
                } else {
                    return 0;
                }
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
            var i = 0, $i = 0, reg = new RegExp(pattern);

            var remover = function (key) {
                if (reg.test(key)) {
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
                    tmp = [], key,
                    reg = new RegExp(pattern);

                for (; i < $i; i++) {
                    key = keys[i];
                    if (reg.test(key)) {
                        tmp.push(key);
                    }
                }
                return tmp;
            });
        };

        // grep contained keys
        this.grepContains = function (list) {
            var i = 0, $i = list.length, c = [];

            var checker = function (num) {
                return index.contains(list[num]).pipe(function (check) {
                    if (check) {
                        return list[num];
                    } else {
                        return;
                    }
                });
            };

            for (; i < $i; i++) {
                c.push(checker(i));
            }

            return $.when.apply(null, c).pipe(function () {
                return _(arguments).without(undefined);
            });
        };

        // list values
        this.values = function () {

            return index.keys().pipe(function (keys) {
                var i = 0, $i = keys.length, c = [];

                var collecter = function (key) {
                    return index.get(key).pipe(function (data) {
                        return data.data;
                    });
                };

                for (; i < $i; i++) {
                    c.push(collecter(keys[i]));
                }

                return $.when.apply(null, c).pipe(function () {
                    return _(arguments).without(undefined);
                });
            });
        };

        // get size
        this.size = function () {
            return index.keys().pipe(function (keys) {
                return keys.length;
            });
        };

        // contains
        this.contains = function (key) {
            return index.contains(key);
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
        this.get = function (key) {
            // array?
            if (_.isArray(key)) {
                var i = 0, obj, tmp = new Array(key.length),
                    c = [], self = this, def = new $.Deferred();

                var getter = function (obj, i) {
                    return self.get(obj).done(function (data) {
                        tmp[i] = data;
                    });
                };

                for (; (obj = key[i]); i++) {
                    c.push(getter(obj, i));
                }


                $.when.apply(null, c).done(function () {
                    def.resolve(tmp);
                }).fail(function (e) {
                    def.reject(e);
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
                return get(tmpKey);
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

                return $.when.apply(null, c).pipe(function () {
                    return _(arguments).without(undefined);
                });
            } else {
                // get key
                key = String(this.keyGenerator(data));

                return add(key, data, timestamp).pipe(function (result) {
                    return key;
                });
            }
        };

        // contains
        var contains = this.contains;
        this.contains = function (key) {
            var self = this;

            var getKey = function (key) {
                var tmpKey = null;
                if (typeof key === 'string' || typeof key === 'number') {
                    tmpKey = key;
                } else {
                    // object, so get key
                    tmpKey = String(self.keyGenerator(key));
                }
                return tmpKey;
            };

            // array?
            if (_.isArray(key)) {
                var i = 0, $i = key.length, found = true;

                var checker = function (key) {
                    var tmpKey = getKey(key);
                    return self.contains(tmpKey).pipe(function (result) {
                        found = found && result;
                        return;
                    });
                };

                var c = [];
                for (; i < $i; i++) {
                    c.push(checker(key[i]));
                }

                return $.when.apply(null, c).pipe(function () {
                    return found;
                });
            } else {
                // simple value
                return contains(getKey(key));
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

                return contains(key).pipe(function (check) {
                    if (check) {
                        return get(key).pipe(function (target) {
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
                        });
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
        var i = 0, $i = localStorage.length, key;
        for (; i < $i; i++) {
            // get key by index
            key = localStorage.key(i);
            console.info('key', key, 'value', JSON.parse(localStorage.getItem(key)));
        }
    };

    return {
        defaultKeyGenerator: defaultKeyGenerator,
        CacheStorage: CacheStorage,
        SimpleCache: SimpleCache,
        ObjectCache: ObjectCache
    };
});
