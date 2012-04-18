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
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define('io.ox/core/cache/indexeddb', function () {

    'use strict';

    var id, storeName,
        dbName = 'oxcache',
        IDB_VERSION = (String(ox.base).split('='))[1].split('.').join(''),//ox.base;

        // Initialising the IndexedDB Objects
        indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB,
        IDBDatabase = window.IDBDatabase || window.mozIDBDatabase || window.webkitIDBDatabase,
        IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange,
        IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction,

        connection = [],

        lastGCRun = {},
        gcTimeout = 30 * 60 * 1000, // 30 Minutes
        ts_cachetimeout = (2 * 24 * 60 * 60 * 1000); // 2 days

    function upgradeCallback(transaction, oldVersion) {

        var db = transaction.db;

        if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
        }

        var objectStore = db.createObjectStore(storeName, {
            "keyPath": "key"
        }, true);

        objectStore.createIndex('accesstime', 'data.accesstime', { unique: false });

        db.transaction([], IDBTransaction.VERSION_CHANGE);
    }

    function openDb(dbName) {

        var def = $.Deferred();

        try {

            var req;

            if (_.isFunction(IDBDatabase.prototype.setVersion)) {
                req = indexedDB.open(dbName);
            } else {
                req = indexedDB.open(dbName, IDB_VERSION, upgradeCallback);
            }

            req.onsuccess = function (e) {
                var db = e.target.result;

                connection[dbName] = db;

                db.onversionchange = function () {
                    db.close();
                    connection[dbName] = db = null;
                };

                def.resolve(db);
            };

            req.onerror = function (e) {
                console.log('indexedDB.open error', e);
                def.reject(e);
            };

        } catch (e) {
            console.log('opendb EXCEPTION', e);
            def.reject(e);
        }

        return def;
    }

    function getConnection(dbName) {
        var def = new $.Deferred();

        if (!!connection[dbName] && connection[dbName].constuctor === window.IDBDatabase) {
            def.resolve(connection[dbName]);
        } else {
            openDb(dbName).done(function (con) {
                def.resolve(con);
            }).fail(function (e) {
                console.log('getConnection reject', e);
                def.reject(e);
            });
        }

        return def;
    }

    function checkStore(dbName, storeName) {
        var def = new $.Deferred();

        getConnection(dbName).done(function (db) {

            if (!db.version || "" + db.version !== "" + IDB_VERSION || !db.objectStoreNames.contains(storeName)) {

                if (_.isFunction(db.setVersion)) {

                    var requestV = db.setVersion(IDB_VERSION);

                    requestV.onsuccess = function (e) {

                        if (db.objectStoreNames.contains(storeName)) {
                            db.deleteObjectStore(storeName);
                        }

                        var objectStore = db.createObjectStore(storeName, {
                            "keyPath": "key"
                        }, true);

                        objectStore.createIndex('accesstime', 'accesstime', { unique: false });

                        def.resolve(db);
                    };

                    requestV.onerror = function (e) {
                        console.log('checkStore requestV error', e);
                        def.reject(e);
                    };

                    requestV.onblocked = function (e) {
                        console.log('checkStore requestV block', e);
                        def.reject(e);
                    };
                } else {
                    def.resolve(db);
                }

            } else {
                def.resolve(db);
            }

        }).fail(function (e) {
            console.log('checkStore reject', e);
            def.reject(e);
        });

        return def;
    }

    function getStore(dbName, storeName) {

        var def = new $.Deferred();

        checkStore(dbName, storeName).done(function (db) {

            try {
                var transactionStartTime = (new Date()).getTime();
                var transaction = db.transaction(storeName, IDBTransaction.READ_WRITE);

                transaction.oncomplete = function (e) {
                    var transactionStopTime = (new Date()).getTime();
                };

                transaction.onabort = function (e) {
                    var transactionStopTime = (new Date()).getTime();
                };

                transaction.onerror = function (e) {
                    var transactionStopTime = (new Date()).getTime();
                };

                var objectStore = transaction.objectStore(storeName);

                def.resolve(objectStore);

            } catch (e) {
                console.log('getStore inner reject', e);
                def.reject(e);
            }
        }).fail(function (e) {
            console.log('getStore reject', e);
            def.reject(e);
        });

        return def;
    }


    function getObjectstore() {
        return getStore('oxcache', storeName);
    }

    var that = {
        setId : function (theId) {
            id = theId;
            storeName = "cache_" + id;
        },
        getId : function () {
            return id;
        },
        getStorageLayerName : function () {
            return 'cache/indexeddb';
        },
        isUsable : function () {
            return Modernizr.indexeddb;
        },
        gc : function () {
            // keypath for accesstime data.accesstime
            return getObjectstore().pipe(function (store) {

                var lastRun = lastGCRun[store.name],
                    now = _.now();

                //console.log('#', store.name, lastRun, _(lastRun).isUndefined(), now , lastRun + gcTimeout, (now > lastRun + gcTimeout), lastGCRun);

                if (_(lastRun).isUndefined() || now > (lastRun + gcTimeout)) {
                    lastGCRun[store.name] = now;
                    console.log('GC RUN', store.name);

                    var deleteRange = IDBKeyRange.upperBound(now - ts_cachetimeout);
                    var index = store.index('accesstime');
                    var deleteCursor = index.openKeyCursor(deleteRange);

                    deleteCursor.onsuccess = function (event) {
                        var cursor = event.target.result;
                        //console.log('success event', event, cursor);
                        if (cursor) {
                            console.log('DELETE', cursor.primaryKey);
                            store['delete'](cursor.primaryKey);
                            cursor['continue']();
                        }
                    };

                    deleteCursor.onerror = function (e) {
                        console.log('cursor error', e);
                    };

                    return deleteCursor;
                } else {
                    //console.log('no gc run for ', store.name, now, lastRun);
                    return null;
                }
            });
        },
        clear : function () {

            return getObjectstore().pipe(function (store) {
                var def = new $.Deferred();
                var request = store.clear();
                request.onsuccess = function (event) {
                    def.resolve();
                };
                request.onerror = function () {
                    def.reject();
                };
                return def;
            });

        },
        get : function (key) {
            that.gc();
            return getObjectstore().pipe(function (store) {

                var def = new $.Deferred();

                try {
                    var getRequest = store.get(key);

                    getRequest.onsuccess = function (event) {

                        if (_.isUndefined(event.target.result) || _.isUndefined(event.target.result.data)) {
                            def.resolve(null);
                        } else {
                            that.set(key, null, true);
                            def.resolve(event.target.result.data);
                        }
                    };

                    getRequest.onerror = function (event) {
                        def.reject(event);
                    };

                } catch ( e) {
                    console.error('get exception > ', e);
                }

                return def;
            });
        },

        set : function (key, data, accessTimeUpdate) {
            that.gc();
            return getObjectstore().pipe(function (store) {

                var def = $.Deferred();

                var testRequest = store.get(key);
                testRequest.onsuccess = function (e) {

                    var result = e.target.result;

                    if (_.isUndefined(result)) {
                        if (accessTimeUpdate === true) {
                            def.reject();
                        } else {
                            var addRequest = store.add({ key: key, data: data, accesstime: _.now() });

                            addRequest.onsuccess = function (e) {
                                def.resolve(e.target.result);
                            };

                            addRequest.onerror = function (e) {
                                def.reject(e);
                            };
                        }
                    } else {
                        if (accessTimeUpdate === true) {
                            data = result.data;
                        }

                        var putRequest = store.put({ key: key, data: data, accesstime: _.now() });

                        putRequest.onsuccess = function (e) {
                            def.resolve(e.target.result);
                        };

                        putRequest.onerror = function (e) {
                            def.reject(e);
                        };

                    }

                };
                testRequest.onerror = function (e) {
                    def.reject(e);
                };

                return def;
            });
        },

        remove : function (key) {

            return getObjectstore().pipe(function (store) {
                var def = new $.Deferred();
                var delRequest = store["delete"](key);

                delRequest.onsuccess = function (event) {
                    def.resolve();
                };
                delRequest.onerror = function () {
                    def.reject();
                };
                return def;
            });
        },

        keys : function () {
            that.gc();
            return getObjectstore().pipe(function (store) {
                var def = new $.Deferred();

                if (_.isFunction(store.getAll)) {

                    var getAllRequest = store.getAll();
                    getAllRequest.onsuccess = function (e) {

                        var keys = _.chain(e.target.result)
                                    .pluck('key')
                                    .value();

                        def.resolve(keys);
                    };

                    getAllRequest.onerror = function (e) {
                        def.reject();
                    };

                } else {

                    var keys = [];
                    var theCursor = store.openCursor();

                    theCursor.onsuccess = function (event) {
                        var cursor = event.target.result;

                        if (cursor) {
                            keys.push(cursor.key);
                            cursor['continue']();
                        } else {
                            def.resolve(keys);
                        }
                    };

                    theCursor.onerror = function (e) {
                        def.reject(e);
                    };
                }

                return def;
            });
        }
    };

    return that;
});
