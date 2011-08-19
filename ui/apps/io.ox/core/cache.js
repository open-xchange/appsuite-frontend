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

define("io.ox/core/cache", function () {
    
    // default key generator
    var defaultKeyGenerator = function (data) {
        if (typeof data === "object" && data) {
            return (data.folder_id || data.folder) + "." + data.id;
        } else {
            return "";
        }
    };
    
    /**
     *  @class CacheStorage
     */
    
    var CacheStorage = (function () {
         
        // persistent storage?
        var hasLocalStorage = false;
        try {
            // supported by browser and explicitly activated?
            hasLocalStorage = (ox.util.getParam("persistence") === "true") && "localStorage" in window && window.localStorage !== null;
        } catch (e) {
            // pssst
        }
        
        return function (name, persistent) {
            
            // init fast storage
            var id = "cache." + (name || "");
            var fast = {};
            
            // use persistent storage?
            var persist = hasLocalStorage && persistent === true;
            
            // copy from persistent storage? (much faster than working on local storage)
            if (persist) {
                // loop over all keys
                var i = 0, $i = localStorage.length;
                var reg = new RegExp("^cache\\." + name + "\\."), key;
                for (; i < $i; i++) {
                    // get key by index
                    key = localStorage.key(i);
                    // match?
                    if (reg.test(key)) {
                        fast[key.replace(reg, "")] = JSON.parse(localStorage.getItem(key));
                    }
                }
            }
            
            this.clear = function () {
                fast = {};
                // persistent clear
                if (persist) {
                    // lazy update
                    setTimeout(function () {
                        // loop over all keys
                        var i = 0, reg = new RegExp("^cache\\." + name + "\\."), key;
                        while (i < localStorage.length) {
                            // get key by index
                            key = localStorage.key(i);
                            // match?
                            if (reg.test(key)) {
                                localStorage.removeItem(key);
                            } else {
                                i++;
                            }
                        }
                    }, 0);
                }
            };
            
            this.get = function (key) {
                return fast[String(key)];
            };
            
            this.set = function (key, data) {
                // fast set
                fast[String(key)] = data;
                // persistent set
                if (persist) {
                    // stringify now
                    var str = JSON.stringify(data);
                    // lazy update
                    setTimeout(function () {
                        localStorage.setItem(id + "." + key, str);
                    }, 0);
                }
            };
            
            this.contains = function (key) {
                return fast[String(key)] !== undefined;
            };
            
            this.remove = function (key) {
                // fast remove
                delete fast[String(key)];
                // persistent remove
                if (persist) {
                    // lazy update
                    setTimeout(function () {
                        localStorage.removeItem(id + "." + key);
                    }, 0);
                }
            };
            
            this.keys = function () {
                var tmp = [], key = "";
                for (key in fast) {
                    tmp.push(key);
                }
                return tmp;
            };
        };
        
    }());
    
    /**
     *  @class Simple Cache
     */
    var SimpleCache = function (name, persistent) {
        
        // private fields
        var index = new CacheStorage(name + ".index", persistent);
        var isComplete = new CacheStorage(name + ".isComplete", persistent);
        
        // clear cache
        this.clear = function () {
            index.clear();
            isComplete.clear();
        };
        
        this.add = function (key, data, timestamp) {
            // timestamp
            timestamp = timestamp !== undefined ? timestamp : ox.util.now();
            // add/update?
            if (!index.contains(key) || timestamp >= index.get(key).timestamp) {
                // type
                var type = !index.contains(key) ? "add modify *" : "update modify *";
                // set
                index.set(key, {
                    data: data,
                    timestamp: timestamp
                });
            }
        };
        
        // get from cache
        this.get = function (key) {
            var data = index.get(key);
            return data !== undefined ? data.data : undefined;
        };
        
        // get timestamp of cached element
        this.time = function (key) {
            return index.contains(key) ? index.get(key).timestamp : 0;
        };
        
        // private
        var remove = function (key) {
            if (index.contains(key)) {
                var o = index.get(key);
                index.remove(key);
            }
        };
        
        // remove from cache (key|array of keys)
        this.remove = function (key) {
            // is array?
            if ($.isArray(key)) {
                var i = 0, $l = key.length;
                for (; i < $l; i++) {
                    remove(key[i]);
                }
            } else {
                remove(key);
            }
        };
        
        // grep remove
        this.grepRemove = function (pattern) {
            var i = 0, keys = index.keys(), $i = keys.length;
            var key, reg = new RegExp(pattern);
            for (; i < $i; i++) {
                key = keys[i];
                if (reg.test(key)) {
                    remove(key);
                }
            }
        };
        
        // list keys
        this.keys = function () {
            return index.keys();
        };

        // grep keys
        this.grepKeys = function (pattern) {
            var i = 0, keys = index.keys(), $i = keys.length;
            var tmp = [], key, reg = new RegExp(pattern);
            for (; i < $i; i++) {
                key = keys[i];
                if (reg.test(key)) {
                    tmp.push(key);
                }
            }
            return tmp;
        };
        
        // grep contained keys
        this.grepContains = function (list) {
            var i = 0, $l = list.length, tmp = [];
            for (; i < $l; i++) {
                if (this.contains(list[i])) {
                    tmp.push(list[i]);
                }
            }
            return tmp;
        };

        // list values
        this.values = function () {
            var i = 0, keys = index.keys(), $i = keys.length;
            var tmp = [], key;
            for (; i < $i; i++) {
                key = keys[i];
                tmp.push(index.get(key).data);
            }
            return tmp;
        };
        
        // get size
        this.size = function () {
            return index.keys().length;
        };
        
        // contains
        this.contains = function (key) {
            return index.contains(key);
        };
        
        // explicit cache
        this.setComplete = function (key, flag) {
            isComplete.set(key, flag === undefined ? true : !!flag);
        };
        
        this.isComplete = function (key) {
            return isComplete.get(key) === true;
        };
        
        this.getClass = function () {
            return "SimpleCache";
        };
    };
    
    /**
     *  @class Flat Cache
     */
    var FlatCache = function (name, persistent, keyGenerator) {
        
        // inherit
        SimpleCache.call(this, name, persistent);
        
        // key generator
        this.keyGenerator = ox.util.isFunction(keyGenerator) ? keyGenerator : defaultKeyGenerator;
        
        // get from cache
        var get = this.get;
        this.get = function (key) {
            // array?
            if (ox.util.isArray(key)) {
                var i = 0, obj, tmp = new Array(key.length);
                for (; obj = key[i]; i++) {
                    tmp[i] = this.get(obj);
                }
                return tmp;
            } else {
                // simple value
                if (typeof key === "string" || typeof key === "number") {
                    return get(key);
                } else {
                    return get(String(this.keyGenerator(key)));
                }
            }
        };
        
        // add to cache
        var add = this.add;
        this.add = function (data, timestamp) {
            // get key
            var key = String(this.keyGenerator(data));
            add.call(this, key, data, timestamp);
            return key;
        };
        
        // add to cache
        this.addArray = function (data, timestamp) {
            if (ox.util.isArray(data)) {
                timestamp = timestamp !== undefined ? timestamp : ox.util.now();
                var i = 0, $l = data.length;
                for (; i < $l; i++) {
                    this.add(data[i], timestamp);
                }
            }
        };
        
        // contains
        var contains = this.contains;
        this.contains = function (key) {
            // array?
            if (ox.util.isArray(key)) {
                var i = 0, $i = key.length, found = true;
                for (; found && i < $i; i++) {
                    found = found && this.contains(key[i]);
                }
                return found;
            } else {
                // simple value
                if (typeof key === "string" || typeof key === "number") {
                    return contains(key);
                } else {
                    // object, so get key
                    return contains(String(this.keyGenerator(key)));
                }
            }
        };
        
        this.getClass = function () {
            return "FlatCache";
        };
    };
    
    /**
     *  @class Folder Cache
     *  @augments FlatCache
     */
    var FolderCache = function (name, persistent) {
        
        // inherit
        FlatCache.call(this, name, persistent, function (data) {
            return data.id;
        });
        
        // private
        var children = new CacheStorage(name + ".children", persistent);
        
        // override "add"
        var add = this.add;
        this.add = function (data, timestamp, prepend) {
            // add to cache
            var key = add.call(this, data, timestamp);
            // get parent id (to string)
            var p = ox.util.firstOf(data.folder_id, data.folder) + "";
            var list = children.get(p) || [];
            // avoid circular reference (root = 0 says parent = 0)
            if (data.id !== p) {
                // add/replace
                var pos = $.inArray(key, list);
                if (pos === -1) {
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
            clear.call(this);
        };
        
        // super class' remove
        var remove = this.remove;
        
        var removeChild = function (key) {
            // remove from all children list
            var data = this.get(key), p, pos, list;
            if (data !== undefined) {
                // get parent id (to string)
                p = ox.util.firstOf(data.folder_id, data.folder) + "";
                list = children.get(p) || [];
                // remove from list
                pos = $.inArray(key, list);
                if (pos > -1) {
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
            if ($.isArray(key)) {
                var i = 0, $l = key.length;
                for (; i < $l; i++) {
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
                var i = 0, keys = children.get(parent), $l = keys.length;
                for (; i < $l; i++) {
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
                var i = 0, keys = children.get(parent), $l = keys.length;
                for (; i < $l; i++) {
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
        
        this.getClass = function () {
            return "FolderCache";
        };
    };
    
    return ox.api.cache = {
        SimpleCache: SimpleCache,
        FlatCache: FlatCache,
        FolderCache: FolderCache
    };
});