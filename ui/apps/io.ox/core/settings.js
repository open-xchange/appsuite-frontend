/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Markus Bode <markus.bode@open-xchange.com>
 */

define("io.ox/core/settings", ['io.ox/core/http', 'io.ox/core/cache'], function (http, cache) {

    'use strict';

    var Settings = function (path) {

        var tree = {}, settingsCache = new cache.SimpleCache('settings', true);

        this.get = function (key, defaultValue) {
            // no argument?
            if (arguments.length === 0) { return tree; }
            // get parts
            var parts = key.split(/\//), tmp = tree || {};
            while (parts.length) {
                key = parts.shift();
                tmp = tmp[key];
                if (!_.isObject(tmp)) {
                    return parts.length ? defaultValue : tmp;
                }
            }
            return tmp;
        };

        this.contains = function (key) {
            key = String(key);
            var parts = key.split(/\//), tmp = tree || {};
            while (parts.length) {
                key = parts.shift();
                if (parts.length) {
                    if (_.isObject(tmp)) {
                        tmp = tmp[key];
                    } else {
                        return false;
                    }
                } else {
                    return _.isObject(tmp) && key in tmp;
                }
            }
        };

        var find = function (key, callback) {
            key = String(key);
            var parts = key.split(/\//), tmp = tree || {};
            while (parts.length) {
                key = parts.shift();
                if (!(key in tmp)) {
                    tmp = (tmp[key] = {});
                } else {
                    if (_.isObject(tmp)) {
                        if (parts.length) {
                            tmp = tmp[key];
                        } else {
                            callback(tmp, key);
                        }
                    } else {
                        break;
                    }
                }
            }
        };

        this.set = function (key, value) {
            find(key, function (tmp, key) {
                tmp[key] = value;
            });
        };

        this.remove = function (key) {
            find(key, function (tmp, key) {
                delete tmp[key];
            });
        };

        var applyDefaults = function () {
            return require([path + '/settings/defaults']).pipe(function (defaults) {
                tree = _.extend(defaults, tree);
            });
        };

        var change = function (e, path, value) {
            this.set(path, value);
        };

        this.createModel = function (ModelClass) {
            return new ModelClass(tree).on('change', $.proxy(change, this));
        };

        this.stringify = function () {
            return JSON.stringify(this.get());
        };

        this.load = function () {

            var load = function () {
                return http.PUT({
                    module: 'jslob',
                    params: { action: 'list' },
                    data: ['apps/' + path]
                })
                .pipe(function (data) {
                    tree = data[0].tree;
                    return applyDefaults();
                })
                .pipe(function () {
                    return settingsCache.add(path, tree);
                });
            };

            return settingsCache.get(path).pipe(function (data) {
                if (data !== null) {
                    return (tree = data);
                } else {
                    return load();
                }
            });
        };

        this.reset = function () {
            return settingsCache.remove(path).pipe(function () {
                return http.PUT({
                    module: 'jslob',
                    params: {
                        action: 'set',
                        id: 'apps/' + path
                    },
                    data: {}
                });
            });
        };

        this.save = function (data) {

            data = data || tree;

            return $.when(
                settingsCache.add(path, data),
                http.PUT({
                    module: 'jslob',
                    params: {
                        action: 'set',
                        id: 'apps/' + path
                    },
                    data: data
                })
            );
        };
    };

    return {
        load: function (name, req, load, config) {
            var settings = new Settings(name);
            settings.load().done(function () {
                load(settings);
            });
        }
    };
});

// define corresponding plugin now (not earlier)
(function () {
    'use strict';
    // just to fool build system.
    window[0 || 'define']('settings', ['io.ox/core/settings'], _.identity);
}());

