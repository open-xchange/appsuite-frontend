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
        lastGCrun = 0,
        gcTimeout = 1000 * 60 * 5, // 5 minutes
        ts_cachetimeout = (new Date()).getTime() - (2 * 24 * 60 * 60 * 1000); // 2 days

    var that = {
        setId: function (theId) {
            id = theId;
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
                    console.log('GC: nothing killed');
                    if (force === true) {
                        console.log('GC: forced -> clear current keyspace');
                        that.clear();
                    }
                } else {
                    console.error('GC: removed', delCounter);
                }

            }
        },

        clear: function () {
            // loop over all keys
            var i = 0, key;
            while (i < localStorage.length) {
                // get key by index
                key = localStorage.key(i);
                // match?
                var reg = new RegExp('^' + id.replace(/\./g, '\\.') + '\\.');
                if (reg.test(key)) {
                    localStorage.removeItem(key);
                } else {
                    i++;
                }
            }
            return $.Deferred().resolve();
        },

        get: function (key) {
            that.gc();

            var item = localStorage.getItem(id + '.' + key);

            if (item !== null) {
                item = JSON.parse(item);
                that.set(key, item.data);
            } else {
                item = { data: undefined };
            }

            return $.Deferred().resolve(item.data);
        },

        set: function (key, data) {
            var def = new $.Deferred();

            that.gc();

            localStorage.removeItem(id + '.' + key);
            try {
                var saveData = {
                    accesstime: _.now(),
                    data: data
                };
                localStorage.setItem(id + '.' + key, JSON.stringify(saveData));
                def.resolve(key);
            } catch (e) {
                if (e.name && e.name === 'QUOTA_EXCEEDED_ERR') {
                    that.gc(true);
                }
                def.reject(e);
            }
            return def;
        },

        contains: function (key) {
            return $.Deferred().resolve(
                    localStorage.getItem(id + '.' + key) !== null);
        },

        remove: function (key) {
            localStorage.removeItem(id + '.' + key);
            return $.Deferred().resolve();
        },

        keys: function () {
            var i, $i, key, tmp = [];

            // loop over all keys
            for (i = 0, $i = localStorage.length; i < $i; i++) {
                // get key by index
                key = localStorage.key(i);
                // match?
                var reg = new RegExp('^' + id.replace(/\./g, '\\.') + '\\.');
                if (reg.test(key)) {
                    tmp.push(key.substr(id.length + 1));
                }
            }

            return $.Deferred().resolve(tmp);
        }
    };

    return that;
});