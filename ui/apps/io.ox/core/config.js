/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define.async('io.ox/core/config', ['io.ox/core/http', 'io.ox/core/cache'], function (http, cache) {

    'use strict';

    var config = {}, configCache, moduleDefined = $.Deferred();

    var get = function (key) {
        var parts = typeof key === 'string' ? key.split(/\./) : key,
            tmp = config || {}, i = 0, $i = parts.length;
        for (; i < $i; i++) {
            if (tmp !== null && tmp !== undefined && parts[i] in tmp) {
                tmp = tmp[parts[i]];
            } else {
                return null;
            }
        }
        return tmp;
    };

    var set = function (key, value) {
        var parts = typeof key === 'string' ? key.split(/\./) : key,
            tmp = config || {}, i = 0, $i = parts.length;
        for (; i < $i; i++) {
            if (tmp[parts[i]]) {
                tmp = tmp[parts[i]];
                if (typeof tmp !== 'object') {
                    console.error('config.set: ' + tmp + ' is a value');
                    return;
                }
            } else {
                tmp = (tmp[parts[i]] = {});
            }
        }
        tmp[parts[$i - 1]] = value;
    };

    var contains = function (key) {
        var parts = typeof key === 'string' ? key.split(/\./) : key,
            tmp = config || {}, i = 0, $i = parts.length;
        for (; i < $i; i++) {
            if (tmp !== null && tmp !== undefined && parts[i] in tmp) {
                tmp = tmp[parts[i]];
            } else {
                return false;
            }
        }
        return true;
    };

    var remove = function (key) {
        var parts = typeof key === 'string' ? key.split(/\./) : key,
            tmp = config || {}, i = 0, $i = parts.length - 1;
        for (; i < $i; i++) {
            if (tmp[parts[i]]) {
                tmp = tmp[parts[i]];
                if (typeof tmp !== 'object') {
                    console.error('config.set: ' + tmp + ' is a value');
                    return;
                }
            } else {
                tmp = (tmp[parts[i]] = {});
            }
        }
        // now, we have the right node, so...
        delete tmp[parts[$i]];
    };

    var api = {

        get: function (path, defaultValue) {
            if (!path) {
                return config;
            }
            if (defaultValue === undefined) {
                return get(path);
            }
            return contains(path) ? get(path) : defaultValue;
        },

        set: function (path, value, permanent) {
            if (path) {
                set(path, value);
                if (permanent) {
                    // save configuration path on server
                    return http.PUT({
                        module: 'config/' + path,
                        appendColumns: false,
                        processResponse: false,
                        data: value
                    });
                }
            }
        },

        remove: function (path) {
            if (path) {
                remove(path);
            }
        },

        contains: function (path) {
            return contains(path);
        },

        load: function () {

            var def = new $.Deferred(),
                // loader
                load = function () {
                    return http.GET({
                        module: 'config',
                        appendColumns: false,
                        processResponse: false
                    })
                    .done(function (data) {
                        config = (data !== undefined ? data.data : {});
                        configCache.add('default', config);
                    });
                };

            // trick to be fast: cached?
            if (!configCache) {
                configCache = new cache.SimpleCache('config');
            }

            configCache.get('default').done(function (data) {
                if (data !== null) {
                    config = data;
                    if (ox.online) { load(); }
                    def.resolve(data);
                } else if (ox.online) {
                    load().done(def.resolve);
                } else {
                    def.resolve(config = {});
                }
            });

            return def;
        },

        save: function () {
            return http.PUT({
                module: 'config',
                appendColumns: false,
                processResponse: false,
                data: config
            });
        }
    };
    api.load().done(function () {
        moduleDefined.resolve(api);
    }).fail(moduleDefined.reject);

    return moduleDefined;
});
