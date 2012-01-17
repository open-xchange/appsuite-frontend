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

    var id, storeName, oxdb = null;
    
    var dbName = 'oxcache';
    
    var IDB_VERSION = ox.base;
    
    // Initialising the IndexedDB Objects
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    
    var connection = [];
    
    function openDb(dbName){
        var def = $.Deferred();
        
        console.log('openDB',connection);
        
        try {

            var req = indexedDB.open(dbName);
            
            console.log('openDB -> req',req);
            
            req.onsuccess = function(e){
                
                console.log('openDB.success');
                
                var db = e.target.result;
                
                connection[dbName] = db;
                
                def.resolve(db);
                
                db.onversionchange = function(){
                    db.close();
                    connection[dbName] = db = null;
                    //delete db;
                };
            };
            
            req.onerror = function(e){
                console.log('openDB.error');
                def.reject(e);
            };
            
        } catch( e ){
            console.log('openDB exception',e);
            def.reject(e);
        }
        
        return def;
    }
    
    function getConnection(dbName){
        var def = new $.Deferred();

        console.log('getConnection');
        
        if( !!connection[dbName] && connection[dbName].constuctor === window.IDBDatabase ){
            def.resolve( connection[dbName] );
        } else {
            openDb(dbName).done(function(con){
                def.resolve(con);
            }).fail(function(e){
                def.reject(e);
            });
        }
        
        return def;
    }
    
    function checkStore(dbName,storeName) {
        var def = new $.Deferred();
        
        console.log('checkStore');
        
        getConnection(dbName).done(function(db){
            
            if(!db.version || ""+db.version !== ""+IDB_VERSION || !db.objectStoreNames.contains(storeName) ){
                
                var requestV = db.setVersion( IDB_VERSION );
                requestV.onsuccess = function(e){
                    
                    if( db.objectStoreNames.contains(storeName) ){
                        db.deleteObjectStore(storeName);
                    }

                    var objectStore = db.createObjectStore(storeName, {
                        "keyPath": "key"
                    }, true);
                    
                    def.resolve(db);
                };
                
                requestV.onerror = function(e){
                    def.reject(e);
                };
                
                requestV.onblocked = function(e){
                    def.reject(e);
                };
            } else {
                def.resolve(db);
            }
            
        }).fail(function(e){
            def.reject(e);
        });
        
        
        return def;
    }
    
    
    
    function getStore( dbName,storeName ){
        var def = new $.Deferred();
        
        console.log('getStore');
        
        checkStore(dbName , storeName).done(function(db){
            console.log('getStore.done',db);
            try {
                var transactionStartTime = (new Date()).getTime();
                var transaction = db.transaction(storeName, IDBTransaction.READ_WRITE);
                
                transaction.oncomplete = function(e){
                    var transactionStopTime = (new Date()).getTime();
                    console.log("===== Transaction Complete ",(transactionStopTime-transactionStartTime),e);
                };
                 
                transaction.onabort = function(e){
                    var transactionStopTime = (new Date()).getTime();
                    console.log("===== Transaction Aborted ",(transactionStopTime-transactionStartTime),e);
                };
                
                transaction.onerror = function(e){
                    var transactionStopTime = (new Date()).getTime();
                    console.log("===== Transaction Error ",(transactionStopTime-transactionStartTime),e);
                };
                
                var objectStore = transaction.objectStore(storeName);

                console.log('getStore -> objectsore',objectStore);
                
                def.resolve(objectStore);
                  
            } catch (e) {
                console.log('getStore.done.catch',e);
                def.reject(e);
            }
        }).fail(function(e){
            console.log('getStore.fail',e);
            def.reject(e);
        });
        
        return def;
    }
    
    
    function getObjectstore(){
        console.log('GET OBJECTSTORE',storeName);
        return getStore('oxcache',storeName);
    }
    
    
    
    
    
    
    
    
    
    
    return {
        setId : function(theId){
            id = theId;
            storeName = "cache_"+id;
        },
        getId : function() {
            return id;
        },
        getStorageLayerName : function(){
            return 'cache/indexeddb';
        },
        clear : function () {
            
            return getObjectstore().pipe(function(store){
                var def = new $.Deferred();
                var request = store.clear();
                request.onsuccess = function(event){
                    def.resolve();
                };
                request.onerror = function(){
                    def.reject();
                };
                return def;
            });
            
        },

        get : function (key) {
            
            console.log('GET OUTER ',key);
            
            return getObjectstore().pipe(function(store){
                
                console.log('GET INNER ',store);
                
                var def = new $.Deferred();
                
                try {
                    var getRequest = store.get(key);
                
                    getRequest.onsuccess = function(event){
                        console.log('GET success',event.target.result);
                        if( _.isUndefined(event.target.result) || _.isUndefined(event.target.result.data) ){
                            def.resolve(undefined);
                        } else {
                            def.resolve(event.target.result.data);
                        }
                    };
                    
                    getRequest.onerror = function(event){
                        console.log('GET error',event);
                        def.reject(event);
                    };
                    
                } catch ( e ) {
                    console.log('get exception > ',e);
                }
                
                return def;
            });
        },

        set : function (key, data) {
            
            return getObjectstore().pipe(function(store){
                
                console.log('SET INNER',key,data);
                
                var def = $.Deferred();
                
                var testRequest = store.get(key);
                testRequest.onsuccess = function(e){
                    
                    console.log('SET check.success');
                    
                    var result = e.target.result;
                    
                    if( _.isUndefined(result) ) {
                        
                        console.log('SET check.success ADD');
                        
                        var addRequest = store.add({'key':key,'data':data});
                        
                        addRequest.onsuccess = function(e){
                            console.log('SET check.success ADD.success');
                            def.resolve(e.target.result);
                        };
                        
                        addRequest.onerror = function(e){
                            console.log('SET check.success ADD.error',e);
                            def.reject(e);
                        };
                        
                    } else {
                        
                        console.log('SET check.success PUT');
                        
                        var putRequest = store.put({'key':key,'data':data});
                        
                        putRequest.onsuccess = function(e){
                            console.log('SET check.success PUT.success',e.target.result);
                            def.resolve(e.target.result);
                        };
                        
                        putRequest.onerror = function(e){
                            console.log('SET check.success PUT.error',e);
                            def.reject(e);
                        };
                        
                    }
                    
                };
                testRequest.onerror = function(e){

                    console.log('SET check.error',e);
                    def.reject(e);
                };
                
                return def;
            });
        },

        contains : function (key) {
            
            return getObjectstore().pipe(function(store){
                var def = new $.Deferred();
                
                var request = store.get(key);
                
                request.onsuccess = function(event){
                    if( !event.target.result ){
                        def.resolve(false);
                    } else {
                        def.resolve(true);
                    }
                };
                
                request.onerror = function(){
                    def.reject();
                };
                return def;
            });
        },

        remove : function (key) {
            
            return getObjectstore().pipe(function(store){
                var def = new $.Deferred();
                var delRequest = store["delete"](key);
                
                delRequest.onsuccess = function(event){
                    def.resolve();
                };
                delRequest.onerror = function(){
                    def.reject();
                };
                return def;
            });
        },

        keys : function () {
            return getObjectstore().pipe(function(store){
                var def = new $.Deferred();
                
                if( _.isFunction(store.getAll) ){
                    
                    var getAllRequest = store.getAll();
                    getAllRequest.onsuccess = function(e){
                        
                        var keys = _.chain(e.target.result)
                                    .pluck('key')
                                    .value();
                        
                        def.resolve(keys);
                    };
                    
                    getAllRequest.onerror = function(e){
                        def.reject();
                    };
                    
                } else {
                    
                    var keys = [];
                    var theCursor = store.openCursor();
                    
                    theCursor.onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            keys.push( cursor.key );
                            cursor['continue']();
                        } else {
                            def.resolve(keys);
                        }
                    };
                    
                    theCursor.onerror = function(e){
                        def.reject(e);
                    };
                }
                
                return def;
            });
        }
    };
});