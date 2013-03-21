/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/core/cache/indexeddb', ['io.ox/core/extensions'], function (ext) {

	'use strict';

    var SCHEMA = 1;
    var QUEUE_DELAY = 5000;

	var instances = {},
        moduleDefined = $.Deferred(),
        db, defunct = false, opened, that;

    defunct = !(Modernizr.indexeddb && window.indexedDB);
    if (defunct) {
        return $.when();
    }

    function IndexeddbStorage(id) {
        var fluent = {},
            queue = { timer: null, list: [] },
            myDB;

        var dbOpened = $.Deferred();// OP(opened);

        OP(db.transaction("databases", "readwrite").objectStore("databases").put({ name: id })).done(function (db) {
            var opened =  window.indexedDB.open(id, SCHEMA);
            opened.onupgradeneeded = function (e) {
                // Set up object stores
                myDB = e.target.result;
                myDB.createObjectStore("cache", {keyPath: "key"});
            };
            OP(opened).done(dbOpened.resolve).fail(dbOpened.reject);
        });

        function operation(fn, readwrite) {
            var def = $.Deferred();
            dbOpened.done(function (db) {
                var tx = readwrite ? db.transaction(["cache"], "readwrite") : db.transaction(["cache"]);
                fn(tx.objectStore("cache")).done(def.resolve).fail(def.reject);
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
                fluent = {};
                return readwrite(function (cache) {
                    return OP(cache.clear());
                });
            },
            get: function (key) {
                key = "" + key;
                if (_.isUndefined(key) || _.isNull(key)) {
                    return $.Deferred().resolve(null);
                }
                if (fluent[key]) {
                    try {
                        return $.Deferred().resolve(JSON.parse(fluent[key]));
                    } catch (e) {
                        console.error("Could not deserialize", id, key, fluent[key], e);
                        return $.Deferred().resolve(null);
                    }
                }
                return read(function (cache) {
                    var def = $.Deferred();
                    function found(obj) {
                        if (!_.isUndefined(obj) && !_.isNull(obj)) {
                            try {
                                var data = JSON.parse(obj.data);
                                fluent[key] = obj.data;
                                def.resolve(data);
                            } catch (e) {
                                // ignore broken values
                                console.error("Could not deserialize", id, key, fluent[key], e);
                            }
                        } else {
                            def.resolve(null);
                        }
                    }
                    OP(cache.get(key)).done(found);

                    return def;
                });
            },
            set: function (key, data, options) {
                key = "" + key;
                fluent[key] = JSON.stringify(data);
                return readwrite(function (cache) {
                    try {
                        return OP(cache.put({
                            key: key,
                            data: JSON.stringify(data)
                        }));
                    } catch (e) {
                        // SKIP
                        console.error("Could not serialize", id, key, data);
                        return $.Deferred().reject();
                    }
                });
            },
            remove: function (key) {
                key = "" + key;
                if (fluent[key]) {
                    delete fluent[key];
                }
                return readwrite(function (cache) {
                    return OP(cache['delete'](key));
                });
            },
            keys: function () {
                return read(function (cache) {
                    var def = $.Deferred(),
                        keys = [];

                    function iter(cursor) {
                        keys.push(cursor.key);
                    }

                    ITER(cache.openCursor()).step(iter).end(function () {
                        def.resolve(keys);
                    }).fail(def.reject);

                    return def;
                });
            },
            close: function () {
                if (myDB) {
                    myDB.close();
                }
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
        },
        clear: function () {
            if (!defunct) {
                return destroyDB();
            }
        }
    };

    // Adapter for IndexedDB operations to the familiar deferreds
    function OP(request) {
        var def = $.Deferred();
        request.onerror = function (event) {
            def.reject(event);
        };
        request.onblocked = function (event) {
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
    var opened = window.indexedDB.open('appsuite.cache.metadata', SCHEMA);

    opened.onupgradeneeded = function (e) {
        // Set up object stores
        var db = e.target.result;
        db.createObjectStore("databases", {keyPath: "name"});
        db.createObjectStore("meta", {keyPath: "id"});
    };

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
        var deletes = [];
        ITER(db.transaction("databases").objectStore("databases").openCursor()).step(function (cursor) {
            if (instances[cursor.key]) {
                instances[cursor.key].close();
            }
            deletes.push(OP(window.indexedDB.deleteDatabase(cursor.key)));
        }).end(function () {
            $.when.apply($, deletes).done(function () {
                instances = {};
                OP(db.transaction("databases", "readwrite").objectStore("databases").clear()).always(function () {
                    initializeDB().done(def.resolve).fail(def.reject);
                }).fail(def.reject);
            }).fail(def.reject);
        }).fail(def.reject);

        return def;
    }

    OP(opened).then(
        function success(theDB) {
            db = theDB;
            if (!db) {
                defunct = true;
                moduleDefined.resolve(that);
                return;
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
                } else if (ox.online && (meta.version !== ox.base || meta.cleanUp)) {
                    meta.cleanUp = true;
                    OP(db.transaction("meta", "readwrite").objectStore("meta").put(meta));
                    setupCompleted = destroyDB().done(function () {
                        meta.cleanUp = false;
                        meta.version = ox.base;
                        OP(db.transaction("meta", "readwrite").objectStore("meta").put(meta));
                    });
                } else {
                    setupCompleted = $.when();
                }
                setupCompleted.then(
                    function setupSuccess() {
                        moduleDefined.resolve(that);
                    },
                    function setupFail() {
                        defunct = true;
                        console.warn('Failed to use IndexedDB');
                        moduleDefined.resolve(that);
                    }
                );
            });
        },
        function fail(event) {
            defunct = true;
            console.warn('Failed to use IndexedDB');
            moduleDefined.resolve(that);
        }
    );

    return moduleDefined.done(function (storage) {
        ext.point("io.ox/core/cache/storage").extend(storage);
    });
});
