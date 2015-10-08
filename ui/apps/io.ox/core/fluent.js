/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/fluent', [], function () {

    'use strict';

    function FluentCache() {

        this.hash = {};
    }

    _.extend(FluentCache.prototype, {

        // get composite key
        serialize: _.cid,

        // get particular key
        getKey: function (obj) {
            return _.isObject(obj) ? this.serialize(obj) : String(obj);
        },

        // get cached item
        get: function (key) {
            key = this.getKey(key);
            return this.hash[key];
        },

        // add item
        set: function (key, data) {

            if (key === undefined) return;

            if (arguments.length === 1 && _.isObject(key)) {
                data = key;
                key = this.getKey(key);
            }

            if (data === undefined) return;

            this.hash[key] = data;
        },

        // check if the cache contains an item
        has: function (key) {
            key = this.getKey(key);
            return key in this.hash;
        },

        // remove by explicit composite key
        remove: function (key) {
            key = this.getKey(key);
            delete this.hash[key];
        },

        // remove by pattern
        purge: function (pattern) {
            if (typeof pattern !== 'string') return;
            for (var key in this.hash) {
                if (key.indexOf(pattern) > -1) delete this.hash[key];
            }
        },

        // remove all entries
        clear: function () {
            this.hash = {};
        },

        // get all keys
        keys: function () {
            return _(this.hash).keys().sort();
        }
    });

    return FluentCache;
});
