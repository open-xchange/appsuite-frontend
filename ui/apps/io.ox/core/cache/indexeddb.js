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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/core/cache/indexeddb', ['io.ox/core/extensions'], function (ext) {
	'use strict';

    var SCHEMA = 1;

	var instances = {},
        moduleDefined = $.Deferred(),
        db, defunct = false, opened, that;

    defunct = Modernizr.indexeddb && window.indexedDB;
    if (defunct) {
        return $.when();
    }

    function IndexeddbStorage(id) {
        db.transaction("databases", "readwrite").objectStore("databases").put({name: id});

        var opened =  window.indexedDB.open("oxcache_" + id, SCHEMA);
        opened.onupgradeneeded = function (e) {
            // Set up object stores
            var db = e.target.result;
            var cache = db.createObjectStore("cache", {keyPath: "key"});

            var important = db.createObjectStore("important", {keyPath: "key"});
        };

        var dbOpened = OP(opened);

        function operation(fn, readwrite) {
            var def = $.Deferred();
            dbOpened.done(function (db) {
                var tx = readwrite ? db.transaction(["cache", "important"], "readwrite") : db.transaction(["cache", "important"]);
                fn(tx.objectStore("cache"), tx.objectStore("important")).done(def.resolve).fail(def.reject);
            });
            return def;
        }

        function read(fn) {
            return operation(fn, false);
        }

        function readwrite(fn) {
            return operation(fn, true);
        }

        _.extend(this, {
            clear: function () {
                return readwrite(function (cache, important) {
                    return $.when(
                        OP(cache.clear()),
                        OP(important.clear())
                    );
                });
            },
            get: function (key) {
                return read(function (cache, important) {
                    var def = $.Deferred();
                    function found(obj) {
                        if (!_.isUndefined(obj) && !_.isNull(obj)) {
                            def.resolve(obj.data);
                        }
                    }
                    $.when(
                        OP(cache.get(key)).done(found),
                        OP(important.get(key)).done(found)
                    ).done(function () {
                        def.resolve(null);
                    });
                    
                    return def;
                });
            },
            set: function (key, data, options) {
                return readwrite(function (cache, important) {
                    if (options && options.important) {
                        return OP(important.put({
                            key: key,
                            data: data
                        }));
                    } else {
                        return OP(cache.put({
                            key: key,
                            data: data,
                            created: _.now()
                        }));
                    }
                });
            },
            remove: function (key) {
                return readwrite(function (cache, important) {
                    return $.when(
                        cache['delete'](key),
                        important['delete'](key)
                    );
                });
            },
            keys: function () {
                return read(function (cache, important) {
                    var cacheKeysCollected = $.Deferred(),
                        importantKeysCollected = $.Deferred(),
                        def = $.Deferred(),
                        keys = [];

                    function iter(cursor) {
                        keys.push(cursor.key);
                    }

                    ITER(important.openCursor()).step(iter).end(importantKeysCollected.resolve).fail(def.reject);
                    ITER(cache.openCursor()).step(iter).end(cacheKeysCollected.resolve).fail(def.reject);

                    $.when(cacheKeysCollected, importantKeysCollected).done(function () {
                        def.resolve(keys);
                    }).fail(def.reject);

                    return def;
                });
            }
        });
    }

    that =  {
        id: 'indexeddb',
        index: 100,
        getInstance: function (theId) {
            if (!instances[theId]) {
                return instances[theId] = new IndexeddbStorage(theId);
            }
            return instances[theId];
        },
        getStorageLayerName: function () {
            return 'cache/indexeddb';
        },
        isUsable: function () {
            return !defunct;
        },
        gc: function () {
        }
    };

    if (defunct) {
        return moduleDefined.resolve(that);
    }

    // Adapter for IndexedDB operations to the familiar deferreds
    function OP(request) {
        var def = $.Deferred();
        request.onerror = function (event) {
            def.reject(event);
        };
        request.onsuccess = function (event) {
            def.resolve(event.target.result);
        };
        return def;
    }


    function ITER(request) {
        var callbacks = {
            step: [],
            end: [],
            fail: []
        }, failed = false, ended = false;

        request.onerror = function (event) {
            if (!failed && !ended) {
                _(callbacks.fail).each(function (fn) {
                    fn(event);
                });
            }
            failed = true;

        };

        request.onsuccess = function (event) {
            if (failed || ended) {
                return;
            }
            if (event.target.result) {
                _(callbacks.step).each(function (fn) {
                    fn(event.target.result);
                });
                event.target.result['continue']();
            } else {
                _(callbacks.end).each(function (fn) {
                    fn();
                });
                ended = true;
            }
        };

        var that = {
            step: function (fn) {
                callbacks.step.push(fn);
                return that;
            },
            end: function (fn) {
                callbacks.end.push(fn);
                return that;
            },
            fail: function (fn) {
                callbacks.fail.push(fn);
                return that;
            }
        };

        return that;
    }

    // Open the Meta-Database

    var opened = window.indexedDB.open("oxcache_metadata", SCHEMA);

    opened.onupgradeneeded = function (e) {
        // Set up object stores
        var db = e.target.result;
        db.createObjectStore("databases", {keyPath: "name"});
        db.createObjectStore("meta", {keyPath: "id"});
    };


    OP(opened).done(function (theDB) {
        db = theDB;
        if (!db) {
            defunct = true;
            moduleDefined.resolve(that);
            return;
        }

        function initializeDB() {
            var tx = db.transaction("meta", "readwrite");
            return OP(tx.objectStore("meta").put({
                id: 'default',
                version: ox.base
            }));
        }

        function destroyDB() {
            // Drop all databases
            var def = $.Deferred();
            ITER(db.transaction("databases").objectStore("databases").openCursor()).step(function (cursor) {
                window.indexedDB.deleteDatabase(cursor.key);
            }).end(function () {
                OP(db.transaction("databases", "readwrite").objectStore("databases").clear()).done(function () {
                    initializeDB().done(def.resolve).fail(def.reject);
                }).fail(def.reject);
            }).fail(def.reject);

            return def;
        }

        // Setup
        db.onerror = function (event) {
            console.error("IndexedDB error: ", event.target.errorCode, event);
        };

        var tx = db.transaction("meta");

        OP(tx.objectStore("meta").get("default")).done(function (meta) {
            var setupCompleted = null;
            if (!meta) {
                setupCompleted = initializeDB();
            } else if (ox.online && (meta.version !== ox.base)) {
                setupCompleted = destroyDB();
            } else {
                setupCompleted = $.when();
            }
            setupCompleted.done(function () {
                moduleDefined.resolve(that);
            });
        });


    }).fail(function (event) {
        defunct = true;
        moduleDefined.resolve(that);
    });


    return moduleDefined.done(function (storage) {
        ext.point("io.ox/core/cache/storage").extend(storage);
    });
});