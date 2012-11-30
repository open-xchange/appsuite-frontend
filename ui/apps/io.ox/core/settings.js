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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/settings', ['io.ox/core/http', 'io.ox/core/cache', 'io.ox/core/event'], function (http, cache, Event) {

    'use strict';

    var clone = function (obj) {
        // simple, fast, and robust
        return JSON.parse(JSON.stringify(obj));
    };

    var get = function (source, path, defaultValue) {
        // no argument?
        if (path === undefined) { return clone(source); }
        // get parts
        var key = String(path),
            parts = key.split(/\//), tmp = clone(source) || {};
        while (parts.length) {
            key = parts.shift();
            tmp = tmp[key];
            if (tmp === undefined) { return defaultValue; }
        }
        return tmp;
    };

    var Settings = function (path) {

        var tree = {},
            meta = {},
            self = this,
            settingsCache = new cache.SimpleCache('settings', true),
            detached = false;

        this.get = function (path, defaultValue) {
            return get(tree, path, defaultValue);
        };

        this.meta = function (path) {
            return get(meta, path, {});
        };

        this.isConfigurable = function (path) {
            var meta = this.meta(path);
            return 'configurable' in meta ? meta.configurable : true; // default is true!
        };

        this.contains = function (path) {
            var key = String(path),
                parts = key.split(/\//), tmp = tree || {};
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

        var resolve = function (path, callback) {
            var key = String(path),
                parts = key.split(/\//), tmp = tree || {};
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

        this.set = function (path, value) {
            // overwrite entire tree?
            if (arguments.length === 1 && !_.isString(path)) {
                tree = path;
                self.trigger('reset', tree);
            } else {
                resolve(path, function (tmp, key) {
                    tmp[key] = value;
                    self.trigger('change:' + path, value).trigger('change', path, value);
                });
            }
        };

        this.remove = function (path) {
            resolve(path, function (tmp, key) {
                delete tmp[key];
                self.trigger('remove:' + path).trigger('remove', path);
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

        this.detach = function () {
            detached = true;
            return this;
        };

        this.load = function () {

            var load = function () {
                return http.PUT({
                    module: 'jslob',
                    params: { action: 'list' },
                    data: ['apps/' + path]
                })
                .pipe(function (data) {
                    if (!detached) {
                        tree = data[0].tree;
                        meta = data[0].meta;
                        return applyDefaults();
                    } else {
                        return $.when();
                    }
                })
                .pipe(function () {
                    self.trigger('load', tree, meta);
                    var data = { tree: tree, meta: meta };
                    return settingsCache.add(path, data).pipe(function () { return data; });
                });
            };

            return settingsCache.get(path).pipe(function (data) {
                try {
                    if (data !== null) {
                        tree = data.tree;
                        meta = data.meta;
                        return data;
                    } else {
                        return load();
                    }
                } finally {
                    load(); // read-through caching
                }
            });
        };

        this.clear = function () {
            return settingsCache.remove(path).pipe(function () {
                return http.PUT({
                    module: 'jslob',
                    params: {
                        action: 'set',
                        id: 'apps/' + path
                    },
                    data: {}
                })
                .done(function () {
                    self.trigger('reset');
                });
            });
        };

        this.save = function (data) {

            data = data || tree;

            if (detached) {
                console.warn('Not saving detached settings.', path);
                return $.when();
            }

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
            )
            .done(function () { self.trigger('save'); });
        };

        Event.extend(this);
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

