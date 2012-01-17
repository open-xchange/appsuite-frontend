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
        
        // persistent storage?
        var hasLocalStorage = Modernizr.localstorage && _.url.param('persistence') !== 'false';
        var hasindexedDB = Modernizr.indexeddb && _.url.param('persistence') !== 'false';

        return function (name, persistent) {

            var preferedFluentCache = 'simple';
            var preferedPersistentCache = 'localstorage';

            var persitentCache = require('io.ox/core/cache/'+preferedPersistentCache);
            var fluentCache = require('io.ox/core/cache/'+preferedFluentCache);
            
            // init fast storage
            var id, reg, fast = {},
                // use persistent storage?
                persist = hasLocalStorage && persistent === true ?
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
                        };
                        
            var getStorageLayer = function(){
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
                return getStorageLayer().set(key,data);
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

        if (!name) {
            // not funny!
            throw 'Each object cache needs a unique name!';
        }

        // clear cache
        this.clear = function () {
            return index.clear();
        };

        this.add = function (key, data, timestamp) {
            var def = new $.Deferred();
            // timestamp
            timestamp = timestamp !== undefined ? timestamp : _.now();
            // add/update?
            index.get(key).done(function(getdata){
                var type = (_(getdata).isUndefined()) ? 'add modify *' : 'update modify *';
                
                if( !_(getdata).isUndefined() ){
                    if( timestamp >= getdata.timestamp ){
                        index.set(key, {
                            data: data,
                            timestamp: timestamp
                        }).done(function(){
                            def.resolve(data);
                        }).fail(function(){
                            def.reject();
                        });
                    } else {
                        def.resolve(getdata.data);
                    }
                } else {
                    index.set(key, {
                        data: data,
                        timestamp: timestamp
                    }).done(function(){
                        def.resolve(data);
                    }).fail(function(){
                        def.reject();
                    });
                }
            });
            
            return def;//data;
        };

        // get from cache
        this.get = function (key) {
            var def = new $.Deferred();
            
            index.get(key).done(function(data){
                def.resolve( data !== undefined ? data.data : undefined );
            }).fail(function(e){
                def.reject(e);
            });
            
            return def;
        };

        // get timestamp of cached element
        this.time = function (key) {
            var def = new $.Deferred();
            
            index.get(key).done(function(data){
                if( !_(data).isUndefined() ){
                    def.resolve(data.timestamp);
                } else {
                    def.resolve(0);
                }
            }).fail(function(){
                def.resolve(0);
            });
            
            return def;
        };

        // remove from cache (key|array of keys)
        this.remove = function (key) {
            // is array?
            if (_.isArray(key)) {
                var def = new $.Deferred();
                var i = 0, $i = key.length,delCounter = 0;
                
                var resolver = function(){
                    delCounter++;
                    
                    if(delCounter===$i){
                        def.resolve();
                    }
                };
                
                var del = function(key){
                    index.remove(key).done(function(){
                        resolver();
                    }).fail(function(){
                        resolver();
                    });
                };
                
                for (; i < $i; i++) {
                    del(key[i]);
                }
                
                return def;
            } else {
                return index.remove(key);
            }
        };

        // grep remove
        this.grepRemove = function (pattern) {
            var def = new $.Deferred();
            var i = 0,$i = 0,removeCounter = 0;
            var reg = new RegExp(pattern);
            
            
            var resolver = function(){
                removeCounter++;
                if( removeCounter===$i ){
                    def.resolve();
                }
            };
            
            var remover = function(key){
                if (reg.test(key)) {
                    index.remove(key).done(function(){
                        resolver();
                    }).fail(function(){
                        resolver();
                    });
                }
            };
            
            index.keys().done(function(keys){
                $i = keys.length;
                
                for (; i < $i; i++) {
                    remover( keys[i] );
                }
            }).fail(function(){
                def.reject();
            });
            
            return def;
        };

        // list keys
        this.keys = function () {
            return index.keys();
        };

        // grep keys
        this.grepKeys = function (pattern) {
            var def = new $.Deferred();
            
            index.keys().done(function(keys){
                var $i = keys.length;
                var i = 0;
                var tmp = [], key, reg = new RegExp(pattern);
                
                for (; i < $i; i++) {
                    key = keys[i];
                    if (reg.test(key)) {
                        tmp.push(key);
                    }
                }
                def.resolve(tmp);
            }).fail(function(e){
                def.reject(e);
            });
            
            return def;
        };

        // grep contained keys
        this.grepContains = function (list) {
            var def = new $.Deferred();
            
            var i = 0, $i = list.length, tmp = [];
            var doneCounter = 0;
            
            var check = function( num ){
                
                index.contains(list[num]).done(function(check){
                    doneCounter++;
                    if (check) {
                        tmp.push(list[num]);
                    }
                    
                    if( doneCounter === $i ){
                        def.resolve(tmp);
                    }
                }).fail(function(){
                    doneCounter++;
                    
                    if( doneCounter === $i ){
                        def.resolve(tmp);
                    }
                });
            };
            
            for (; i < $i; i++) {
                check(i);
            }
            
            return def;
        };

        // list values
        this.values = function () {
            
            var def = new $.Deferred();
            
            index.keys().done(function(keys){
                
                var i = 0, $i = keys.length,
                tmp = [], collectCounter = 0;
                
                var collect = function(key){
                    index.get(key).done(function(data){
                        collectCounter++;

                        tmp.push(data.data);

                        if(collectCounter===$i){
                            def.resolve(tmp);
                        }
                    }).fail(function(){
                        collectCounter++;
                        if(collectCounter===$i){
                            def.resolve(tmp);
                        }
                    });
                };
                
                for (; i < $i; i++) {
                    collect(keys[i]);
                }
            });
            
            return def;
        };

        // get size
        this.size = function () {
            var def = new $.Deferred();
            
            index.keys().done(function(keys){
                def.resolve( keys.length );
            }).fail(function(){
                def.reject();
            });

            return def;
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
            var def = new $.Deferred();
            // array?
            if (_.isArray(key)) {
                var i = 0, obj, tmp = new Array(key.length), max = key.length;
                var getCounter = 0;
                
                var getResolver = function(){
                    getCounter++;
                    if(getCounter===max){
                        def.resolve(tmp);
                    }
                };
                
                var getter = function(key){
                    get(key).done(function(data){
                        tmp[i] = data;
                        getResolver();
                    }).fail(getResolver);
                };
                
                for (; (obj = key[i]); i++) {
                    getter(obj,i);
                }
            } else {
                // simple value
                if (typeof key === 'string' || typeof key === 'number') {
                    get(key).done(function(data){
                        def.resolve(data);
                    }).fail(function(e){
                        def.reject(e);
                    });
                } else {
                    get(String(this.keyGenerator(key))).done(function(data){
                        def.resolve(data);
                    }).fail(function(e){
                        def.reject(e);
                    });
                }
            }
            
            return def;
        };

        // add to cache
        var add = this.add;
        this.add = function (data, timestamp) {
            var key, def = new $.Deferred();
            if (_.isArray(data)) {
                
                timestamp = timestamp !== undefined ? timestamp : _.now();
                var i = 0, $i = data.length, addCounter = 0, tmp = [];
                
                var resolver = function(){
                    addCounter++;
                    if(addCounter===$i){
                        def.resolve(tmp);
                    }
                };
                
                var adder = function(key,data,i,timestamp){
                    add(key, data, timestamp).done(function(data){
                        tmp.push(key);
                        resolver();
                    }).fail(resolver);
                };
                
                for (; i < $i; i++) {
                    key = String(this.keyGenerator(data[i]));
                    adder(key,data[i],i,timestamp);
                }
            } else {
                // get key
                key = String(this.keyGenerator(data));
                
                add(key, data, timestamp).done(function(result){
                    def.resolve(key);
                }).fail(function(e){
                    def.reject(e);
                });
            }
            
            return def;
        };

        // contains
        var contains = this.contains;
        this.contains = function (key) {
            var def = new $.Deferred();
            
            // array?
            if (_.isArray(key)) {
                var i = 0, $i = key.length, found = true;
                for (; found && i < $i; i++) {
                    found = found && this.contains(key[i]);
                }
                return found;
            } else {
                // simple value
                if (typeof key === 'string' || typeof key === 'number') {
                    return contains(key);
                } else {
                    // object, so get key
                    return contains(String(this.keyGenerator(key)));
                }
            }
            
            return def;
        };

        this.merge = function (data, timestamp) {
            var key, target, id, changed = false, def = new $.Deferred();
            if (_.isArray(data)) {
                timestamp = timestamp !== undefined ? timestamp : _.now();
                var i = 0, $i = data.length;
                for (; i < $i; i++) {
                    key = String(this.keyGenerator(data[i]));
                    changed = changed || this.merge(data[i], timestamp);
                }
                return changed;
            } else {
                key = String(this.keyGenerator(data));
                if (contains(key)) {
                    target = get(key);
                    // only merge properties of existing object
                    for (id in target) {
                        if (data[id] !== undefined) {
                            changed = changed || !_.isEqual(target[id], data[id]);
                            target[id] = data[id];
                        }
                    }
                    if (changed) {
                        this.add(target, timestamp);
                    }
                    return changed;
                } else {
                    return false;
                }
            }
            return def;
        };

        var remove = this.remove;
        this.remove = function (data) {
            if (_.isArray(data)) {
                var i = 0, $i = data.length;
                for (; i < $i; i++) {
                    this.remove(data[i]);
                }
            } else {
                // simple value
                if (typeof data === 'string' || typeof data === 'number') {
                    remove(data);
                } else {
                    // object, so get key
                    remove(String(this.keyGenerator(data)));
                }
            }
        };
    };

    /**
     *  @class Folder Cache
     *  @augments ObjectCache
     */
    var FolderCache = function (name, persistent) {

        // inherit
        ObjectCache.call(this, name, persistent, function (data) {
            return data.id;
        });

        // private
        var children = new CacheStorage(name + '.children', persistent),
            isComplete = new CacheStorage(name + '.isComplete', persistent);

        // override 'add'
        var add = this.add;
        this.add = function (data, timestamp, prepend) {
            // add to cache
            var key = add.call(this, data, timestamp),
                // get parent id (to string)
                p = _.firstOf(data.folder_id, data.folder) + '',
                list = children.get(p) || [],
                pos;
            // avoid circular reference (root = 0 says parent = 0)
            if (data.id !== p) {
                // add/replace
                if ((pos = _.indexOf(key, list)) === -1) {
                    // add
                    if (prepend === true) {
                        list.unshift(key);
                    } else {
                        list.push(key);
                    }
                } else {
                    // replace
                    list.splice(pos, 1, key);
                }
                children.set(p, list);
            }
        };
        this.prepend = function (data, timestamp) {
            this.add(data, timestamp, true);
        };

        var clear = this.clear;
        this.clear = function () {
            children.clear();
            isComplete.clear();
            clear.call(this);
        };

        // super class' remove
        var remove = this.remove;

        var removeChild = function (key) {
            // remove from all children list
            var data = this.get(key), p, pos, list;
            if (data !== undefined) {
                // get parent id (to string)
                p = _.firstOf(data.folder_id, data.folder) + '';
                list = children.get(p) || [];
                // remove from list
                if ((pos = _.indexOf(key, list)) > -1) {
                    list.splice(pos, 1);
                }
                children.set(p, list);
            }
            // remove its own children
            this.removeChildren(key);
            // remove element
            remove.call(this, key);
        };

        this.remove = function (key) {
            // is array?
            if (_.isArray(key)) {
                var i = 0, $i = key.length;
                for (; i < $i; i++) {
                    removeChild.call(this, key[i]);
                }
            } else {
                removeChild.call(this, key);
            }
        };

        this.removeChildren = function (parent, deep) {
            // has children?
            if (deep === true && children.contains(parent)) {
                // loop
                var i = 0, keys = children.get(parent), $i = keys.length;
                for (; i < $i; i++) {
                    // remove its own children
                    if (keys[i] !== parent) {
                        this.removeChildren(keys[i], true);
                    }
                    // remove element
                    remove.call(this, keys[i]);
                }
            }
            // remove entry
            children.remove(parent);
            // mark as incomplete
            this.setComplete(parent, false);
        };

        this.children = function (parent) {
            var tmp = [];
            // exists?
            if (children.contains(parent)) {
                // loop
                var i = 0, keys = children.get(parent), $i = keys.length;
                for (; i < $i; i++) {
                    tmp.push(this.get(keys[i]));
                }
            }
            return tmp;
        };

        this.parents = function () {
            return children.keys();
        };

        // helps debugging
        this.inspect = function (key) {
            return {
                keys: this.grepKeys(key),
                children: this.children(key),
                complete: this.isComplete(key)
            };
        };

        // explicit cache
        this.setComplete = function (key, flag) {
            isComplete.set(key, flag === undefined ? true : !!flag);
        };

        this.isComplete = function (key) {
            return isComplete.get(key) === true;
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
        ObjectCache: ObjectCache,
        FolderCache: FolderCache
    };
});