/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/cache/localstorage', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    var // 1MB
        MAX_LENGTH = 1024 * 1024,
        // queue
        QUEUE_DELAY = 5000,
        queue = { timer: null, list: [] },
        // fluent backup cache
        fluent = {},
        // access time
        access = {},
        // Instances
        instances = {},
        that;

    function syncSet(cid, json) {
        try {
            localStorage.removeItem(cid);
            localStorage.setItem(cid, json);
        } catch (e) {
            if (e.name === 'QUOTA_EXCEEDED_ERR') {
                console.warn('localStorage: Exceeded quota!', e, 'Object size', Math.round(json.length / 1024) + 'Kb');
                that.gc();
            }
        }
    }

    function deferredSet(cid, json) {
        if (queue.timer === null) {
            queue.timer = setTimeout(function () {
                _(queue.list).each(function (obj) {
                    syncSet(obj.cid, obj.json);
                });
                queue = { timer: null, list: [] };
            }, QUEUE_DELAY);
        } else {
            queue.list.push({ cid: cid, json: json });
        }
    }

    function WebStorage(id) {
        var reg = new RegExp('^' + id.replace(/\./g, '\\.') + '\\.');

        _.extend(this, {
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
                    if (reg.test(key)) {
                        delete fluent[key];
                    }
                }
                return $.when();
            },

            get: function (key) {

                // fetch first, then GC
                var cid = id + '.' + key, inFluent = cid in fluent, data, def = $.Deferred();

                // try to be fast without blocking
                if (inFluent) {
                    data = JSON.parse(fluent[cid]);
                    def.resolve(data);
                    access[cid] = _.now();
                } else {
                    setTimeout(function () {
                        var item = localStorage.getItem(cid);
                        if (item !== null) {
                            access[cid] = _.now();
                            data = JSON.parse(fluent[cid] = item);
                            def.resolve(data);
                        } else {
                            def.resolve(null);
                        }
                    }, 0);
                }

                return def;
            },

            set: function (key, data) {

                var cid = id + '.' + key;

                // use fluent cache to be fast
                data = JSON.stringify(data);
                fluent[cid] = data;
                access[cid] = _.now();

                if (data.length <= MAX_LENGTH) {
                    if (/app-cache\.index\.savepoints$/.test(cid)) {
                        // need to be sync here; otherwise failover fails
                        syncSet(cid, data);
                    } else {
                        // don't block
                        deferredSet(cid, data);
                    }
                }

                return $.Deferred().resolve(key);
            },

            remove: function (key) {
                var cid = id + '.' + key;
                delete fluent[cid];
                // do this sync
                localStorage.removeItem(cid);
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
                        tmp.push(key.substr(id.length + 1));
                    }
                }
                return $.Deferred().resolve(_(tmp).uniq());
            }
        });
    }

    that = {
        id: 'localstorage',
        index: 200,
        dump: function () {
            console.debug('fluent', fluent, 'access', access);
        },

        getStorageLayerName: function () {
            return 'cache/localstorage';
        },

        isUsable: function () {
            return !window.cordova && Modernizr.localstorage;
        },

        gc: function () {

            var cid, items = [], removed = 0, i = 0, $i;

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
        },

        getInstance: (function () {

            var firstRun = true;

            function clear() {
                // clear caches due to version change?
                var ui = JSON.parse(localStorage.getItem('appsuite-ui') || '{}');
                if (ui.version !== ox.version && _.url.hash('keep-data') !== 'true') {
                    if (ox.debug === true) {
                        console.warn('LocalStorage: Clearing persistent caches due to UI update');
                    }
                    localStorage.clear();
                    localStorage.setItem('appsuite-ui', JSON.stringify({ version: ox.version }));
                }
                firstRun = false;
            }

            return function (id) {
                if (firstRun) clear();
                if (!instances[id]) {
                    return instances[id] = new WebStorage(id);
                }
                return instances[id];
            };
        }()),

        clear: function () {
            fluent = {};
            instances = {};
            localStorage.clear();
        }

    };

    ext.point('io.ox/core/cache/storage').extend(that);

    return that;
});
