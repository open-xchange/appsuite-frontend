/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Martin Holzhauer <martin.holzhauer@open-xchange.com>
 */

define('io.ox/core/cache/localstorage', function () {

    'use strict';

    var id = null,
        reg = null,
        lastGCrun = 0,
        gcTimeout = 1000 * 60 * 5, // 5 minutes
        ts_cachetimeout = (new Date()).getTime() - (2 * 24 * 60 * 60 * 1000), // 2 days

        // max size for persistent objects
        MAX_LENGTH = 1024 * 1024, // 1MB

        // fluent backup cache
        large = {};

    var that = {

        dump: function () {
            console.log(large);
        },

        setId: function (theId) {
            id = theId;
            reg = new RegExp('^' + id.replace(/\./g, '\\.') + '\\.');
        },

        getStorageLayerName: function () {
            return 'cache/localstorage';
        },

        isUsable: function () {
            return Modernizr.localstorage;
        },

        gc: function (force) {
            var timeStamp = (new Date()).getTime();

            if (timeStamp > (lastGCrun + gcTimeout) || force === true) {
                lastGCrun = timeStamp;
                // TODO: make an awesome garbage collection
                var i, $i, key, tmp = [], delCounter = 0;

                // loop over all keys
                for (i = localStorage.length - 1; i >= 0; i--) {

                    try {
                        // get key by index
                        key = localStorage.key(i);
                        // match?
                        try {
                            var rawData = localStorage.getItem(key);
                            var item = JSON.parse(rawData);

                            if (!!item && !!item.accesstime) {
                                if (item.accesstime <= ts_cachetimeout) {
                                    delCounter++;
                                    localStorage.removeItem(key);
                                }
                            }
                        } catch (e) {
                            console.error('GC: getItem Exception', key, i, e);
                        }
                    } catch (ex) {
                        console.error('GC: key Exception', i, ex);
                    }
                }

                // if garbage collection does not kill any item, do something else
                if (delCounter === 0) {
                    //console.debug('GC: nothing killed');
                    if (force === true) {
                        //console.debug('GC: forced -> clear current keyspace');
                        that.clear();
                    }
                } else {
                    console.warn('GC: removed', delCounter);
                }

            }
        },

        clear: function () {
            // loop over all keys (do this in two loops due to very strange async-ish behaviour in some browsers)
            var i = 0, $i = localStorage.length, key, tmp = [];
            for (; i < $i; i++) {
                // copy?
                if (reg.test(key = localStorage.key(i))) {
                    tmp.push(key);
                }
            }
            // loop over tmp and remove items
            _(tmp).each(function (key) {
                localStorage.removeItem(key);
            });
            // clear backup cache
            for (key in large) {
                if (reg.test(id + '.' + key)) {
                    delete large[id + '.' + key];
                }
            }
            return $.when();
        },

        get: function (key) {

            // fetch first, then GC
            var cid = id + '.' + key,
                item = localStorage.getItem(cid);

            if (item !== null) {
                item = JSON.parse(item);
                that.set(key, item.data);
            } else if (cid in large) {
                item = large[cid];
            } else {
                item = { data: null };
            }

            return $.Deferred().resolve(item.data);
        },

        set: function (key, data) {

            var def = new $.Deferred(),
                saveData = {
                    accesstime: _.now(),
                    data: data
                },
                json,
                cid = id + '.' + key;

            localStorage.removeItem(cid);
            that.gc();

            try {
                json = JSON.stringify(saveData);
                if (json.length <= MAX_LENGTH) {
                    localStorage.setItem(cid, json);
                } else {
                    large[cid] = saveData;
                }
                def.resolve(key);
            } catch (e) {
                if (e.name && e.name === 'QUOTA_EXCEEDED_ERR') {
                    console.warn('localStorage: Exceeded quota!', e, 'Object size', Math.round(json.length / 1024) + 'Kb');
                    that.gc(true);
                }
                def.reject(e);
            }
            return def;
        },

        remove: function (key) {
            var cid = id + '.' + key;
            localStorage.removeItem(cid);
            delete large[cid];
            return $.Deferred().resolve();
        },

        keys: function () {
            var i, $i, key, tmp = [];
            // loop over all keys
            for (i = 0, $i = localStorage.length; i < $i; i++) {
                // get key by index
                key = localStorage.key(i);
                // match?
                if (reg.test(key)) {
                    tmp.push(key.substr(id.length + 1));
                }
            }
            // loop over backup cache
            for (key in large) {
                if (reg.test(key)) {
                    tmp.push(key);
                }
            }
            return $.Deferred().resolve(tmp);
        }
    };

    return that;
});
