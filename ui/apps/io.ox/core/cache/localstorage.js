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

    var id = null;

    var clear = function () {
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
    };

    function gc() {
        // TODO: make an awsome garbage collection
        clear();
    }

    return {
        setId: function (theId) {
            id = theId;
        },

        getStorageLayerName: function () {
            return 'cache/localstorage';
        },

        isUsable: function () {
            return Modernizr.localstorage;
        },

        clear: clear,

        get: function (key) {
            var item = localStorage.getItem(id + '.' + key);
            return $.Deferred().resolve(
                    item !== null ? JSON.parse(item) : undefined);
        },

        set: function (key, data) {
            var def = new $.Deferred();

            localStorage.removeItem(id + '.' + key);
            try {
                localStorage.setItem(id + '.' + key, JSON.stringify(data));
                def.resolve(key);
            } catch (e) {
                if (e.name && e.name === 'QUOTA_EXCEEDED_ERR') {
                    gc();
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
});