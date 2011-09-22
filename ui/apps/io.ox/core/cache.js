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
        var hasLocalStorage = Modernizr.localstorage && _.url.param("persistence") !== "false";
        
        return function (name, persistent) {
            
            // init fast storage
            var id = "cache." + (ox.user || "_") + "." + (name || ""),
                reg = new RegExp("^" + id.replace(/\./g, "\\.") + "\\."),
                fast = {},
                // use persistent storage?
                persist = hasLocalStorage && ox.user !== "" && persistent === true;
            
            // copy from persistent storage? (much faster than working on local storage)
            if (persist) {
                // loop over all keys
                var i = 0, $i = localStorage.length, key;
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
                        var i = 0, key;
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
                    // serialize now (!)
                    var str = JSON.stringify(data);
                    // lazy update
                    setTimeout(function () {
                        localStorage.removeItem(id + "." + key);
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
        var index = new CacheStorage(name + ".index", persistent),
            isComplete = new CacheStorage(name + ".isComplete", persistent);
        
        if (!name) {
            // not funny!
            throw("Each object cache needs a unique name!");
        }
        
        // clear cache
        this.clear = function () {
            index.clear();
            isComplete.clear();
        };
        
        this.add = function (key, data, timestamp) {
            // timestamp
            timestamp = timestamp !== undefined ? timestamp : _.now();
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
                var i = 0, $i = key.length;
                for (; i < $i; i++) {
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
            var i = 0, $i = list.length, tmp = [];
            for (; i < $i; i++) {
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
                var i = 0, obj, tmp = new Array(key.length);
                for (; (obj = key[i]); i++) {
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
            var key;
            if (_.isArray(data)) {
                timestamp = timestamp !== undefined ? timestamp : _.now();
                var i = 0, $i = data.length;
                for (; i < $i; i++) {
                    key = String(this.keyGenerator(data[i]));
                    add.call(this, key, data[i], timestamp);
                }
            } else {
                // get key
                key = String(this.keyGenerator(data));
                add.call(this, key, data, timestamp);
                return key;
            }
        };
        
        // contains
        var contains = this.contains;
        this.contains = function (key) {
            // array?
            if (_.isArray(key)) {
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
        
        this.merge = function (data, timestamp) {
            var key, target, id, changed = false;
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
        };
        
        var remove = this.remove;
        this.remove = function (data) {
            if (_.isArray(data)) {
                var i = 0, $i = data.length, key;
                for (; i < $i; i++) {
                    key = String(this.keyGenerator(data[i]));
                    remove(key);
                }
            } else {
                // simple value
                if (typeof data === "string" || typeof data === "number") {
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
        var children = new CacheStorage(name + ".children", persistent);
        
        // override "add"
        var add = this.add;
        this.add = function (data, timestamp, prepend) {
            // add to cache
            var key = add.call(this, data, timestamp);
            // get parent id (to string)
            var p = _.firstOf(data.folder_id, data.folder) + "";
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
                p = _.firstOf(data.folder_id, data.folder) + "";
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
    };
    
    // debug!
    window.dumpStorage = function () {
        var i = 0, $i = localStorage.length, key;
        for (; i < $i; i++) {
            // get key by index
            key = localStorage.key(i);
            console.info("key", key, "value", JSON.parse(localStorage.getItem(key)));
        }
    };
    
    return {
        SimpleCache: SimpleCache,
        ObjectCache: ObjectCache,
        FolderCache: FolderCache,
        defaultKeyGenerator: defaultKeyGenerator
    };
});