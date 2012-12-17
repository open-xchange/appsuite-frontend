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
        if (_.isUndefined(obj)) {
            return undefined;
        }
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error(obj, JSON.stringify(obj), e, e.stack);
            throw e;
        }
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

        var resolve = function (path, callback, create) {
            var key = String(path),
                parts = key.split(/\//),
                tmp = tree || {};
            while (parts.length) {
                key = parts.shift();
                if (_.isObject(tmp)) {
                    if (parts.length) {
                        if (!(key in tmp) && !!create) {
                            tmp = (tmp[key] = {});
                        } else {
                            tmp = tmp[key];
                        }
                    } else {
                        callback(tmp, key);
                    }
                } else {
                    break;
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
                }, true);
            }
            return this;
        };

        this.remove = function (path) {
            resolve(path, function (tmp, key) {
                var value = tmp[key];
                delete tmp[key];
                self.trigger('remove:' + path).trigger('remove change', path, value);
            });
            return this;
        };

        var applyDefaults = function () {
            return require([path + '/settings/defaults']).pipe(function (defaults) {
                tree = _.extend(defaults, tree);
            });
        };

        var change = function (model, e) {
            _(e.changes).each(function (changed, path) {
                if (changed) {
                    self.set(path, model.get(path));
                }
            });
        };

        this.createModel = function (ModelClass) {
            return new ModelClass(tree).on('change', change);
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
                    data: [path]
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
                if (data !== null) {
                    tree = data.tree;
                    meta = data.meta;
                    if (ox.online) load(); // read-through caching
                    return data;
                } else if (ox.online) {
                    return load();
                } else { // offline
                    self.detach();
                    return { tree: tree, meta: meta };
                }
            });
        };

        this.clear = function () {
            return settingsCache.remove(path).pipe(function () {
                return http.PUT({
                    module: 'jslob',
                    params: {
                        action: 'set',
                        id: path
                    },
                    data: {}
                })
                .done(function () {
                    tree = {};
                    meta = {};
                    self.trigger('reset');
                });
            });
        };

        this.save = (function () {

            var save = _.throttle(function (data) {
                http.PUT({
                    module: 'jslob',
                    params: { action: 'set', id: path },
                    data: data
                })
                .done(function () { self.trigger('save'); });
            }, 5000); // limit to 5 seconds

            return function (custom) {

                if (detached) {
                    console.warn('Not saving detached settings.', path);
                }

                var data = { tree: custom || tree, meta: meta };
                settingsCache.add(path, data);
                save(data.tree);

                return this;
            };
        }());

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

