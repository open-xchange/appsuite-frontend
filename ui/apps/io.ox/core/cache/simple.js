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

define('io.ox/core/cache/simple', ["io.ox/core/extensions"],
        function (ext) {

            'use strict';

            var storage = {},
                instances = {};

            function SimpleStorage(id) {
                storage[id] = {};
                _.extend(this, {
                    clear: function () {
                        storage[id] = {};
                        return $.Deferred().resolve();
                    },
                    get: function (key) {
                        var key = String(key);
                        return $.Deferred().resolve(
                            key in storage[id] ? storage[id][key] : null
                        );
                    },
                    set: function (key, data) {
                        storage[id][String(key)] = data;
                        return $.Deferred().resolve(key);
                    },
                    remove: function (key) {
                        delete storage[id][String(key)];
                        return $.Deferred().resolve();
                    },
                    keys: function () {
                        var key, tmp = [];
                        for (key in storage[id]) {
                            tmp.push(key);
                        }
                        return $.Deferred().resolve(tmp);
                    }
                });
            }




            var that = {
                id: 'simple',
                index: 1000,
                getInstance: function (theId) {
                    if (!instances[theId]) {
                        return instances[theId] = new SimpleStorage(theId);
                    }
                    return instances[theId];
                },
                getStorageLayerName: function () {
                    return 'cache/simple';
                },
                isUsable: function () {
                    return true;
                },
                gc: function () {
                },
                clear: function () {
                    storage = {};
                    instances = {};
                }
            };

            ext.point("io.ox/core/cache/storage").extend(that);

            return that;
        });
