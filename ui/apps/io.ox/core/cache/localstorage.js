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
        lastGC = 0,
        gcTimeout = 1000 * 60 * 5, // 5 minutes
        ts_cachetimeout = (new Date()).getTime() - (2 * 24 * 60 * 60 * 1000), // 2 days
        // max size for persistent objects
        MAX_LENGTH = 1024 * 1024, // 1MB
        // fluent backup cache
        fluent = {},
        // access time
        access = {},
        that;

    function deferredSet(cid, json) {
        setTimeout(function () {
            try {
                localStorage.removeItem(cid);
                localStorage.setItem(cid, json);
            } catch (e) {
                if (e.name === 'QUOTA_EXCEEDED_ERR') {
                    console.warn('localStorage: Exceeded quota!', e, 'Object size', Math.round(json.length / 1024) + 'Kb');
                    that.gc();
                }
            }
        }, 0);
    }

    that = {

        dump: function () {
            console.log(fluent);
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

            var now = _.now(), cid, items = [], removed = 0, i = 0, $i;

            if (now > (lastGC + gcTimeout) || force) {

                // remember for next round
                lastGC = now;

                // loop #1: get number of items
                for (cid in access) {
                    items.push([cid, access[cid]]);
                }

                // sort by access date
                items.sort(function (a, b) { return a[1] - b[1]; });

                // loop #2: remove oldest 30%
                for ($i = Math.floor(items.length / 3); i < $i; i++) {
                    localStorage.removeItem(items[i][0]);
                    removed++;
                }

                console.warn('GC. items', items.length, 'removed', removed);
                items = null;
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
            for (key in fluent) {
                if (reg.test(id + '.' + key)) {
                    delete fluent[id + '.' + key];
                }
            }
            return $.when();
        },

        get: function (key) {

            // fetch first, then GC
            var cid = id + '.' + key, inFluent = cid in fluent, data, def = $.Deferred();

            // try to be fast without blocking
            if (inFluent) {
                data = fluent[cid];
                def.resolve(data);
                access[cid] = _.now();
            } else {
                setTimeout(function () {
                    var item = localStorage.getItem(cid);
                    if (item !== null) {
                        data = JSON.parse(item);
                        def.resolve(data);
                    } else {
                        def.resolve(null);
                    }
                }, 0);
            }

            return def;
        },

        set: function (key, data) {

            var cid = id + '.' + key, json;

            // use fluent cache to be fast
            fluent[cid] = data;
            access[cid] = _.now();

            if ((json = JSON.stringify(data)).length <= MAX_LENGTH) {
                // don't block
                deferredSet(cid, json);
            }

            return $.when();
        },

        remove: function (key) {
            var cid = id + '.' + key;
            delete fluent[cid];
            setTimeout(function () {
                localStorage.removeItem(cid);
            }, 0);
            return $.when();
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
            for (key in fluent) {
                if (reg.test(key)) {
                    tmp.push(key);
                }
            }
            return $.Deferred().resolve(tmp);
        }
    };

    return that;
});
