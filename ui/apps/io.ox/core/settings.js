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

    var settingsWrapper = function () {

        var settings = {},
            settingsCache;

        var settingsInitial = function (settings, path, settingsBase, callback) {
            var deferred = $.Deferred();

            require([settingsBase + '/' + path + '/settings/defaults'], function (u) {
                _.each(u, function (value, key) {
                    if (settings[key] === undefined) {
                        settings[key] = value;
                    }
                });

                if (_.isFunction(callback)) {
                    callback();
                }

                deferred.resolve();
            });
            return deferred;
        };

        var get = function (key) {
            var parts = key.split(/\//),
                tmp = settings || {}, i = 0, $i = parts.length;
            if (parts[1]) {
                for (; i < $i; i++) {
                    var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty([i]) && typeof tmp[i] !== 'undefined' && tmp[i] !== null);
                    if (tmpHasSubNode) {
                        tmp = tmp[i];
                    } else {
                        tmp = null;
                        return null;
                    }
                }
            } else {
                return tmp[key];
            }

        };

        var set = function (key, value) {
            var parts = typeof key === 'string' ? key.split(/\./) : key,
                tmp = settings || {}, i = 0, $i = parts.length;
            if (parts[1]) {
                for (; i < $i; i++) {
                    if (tmp[parts[i]]) {
                        tmp = tmp[parts[i]];
                        if (typeof tmp !== 'object') {
                            return;
                        }
                    } else {
                        tmp = (tmp[parts[i]] = {});
                    }
                }
            }
            tmp[parts[$i - 1]] = value;
        };

        var contains = function (key) {
            var parts = key.split(/\//),
                tmp = settings || {},
                falseSwitch;

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                    falseSwitch = true;
                } else {
                    falseSwitch = false;
                }
            });
            return falseSwitch;
        };

        var remove = function (key) {
            var parts = key.split(/\//),
                tmp = settings || {},  i = 0, $i = parts.length - 1;
            for (; i < $i; i++) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(i) && typeof tmp[i] !== 'undefined' && tmp[i] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[i];
                    if (typeof tmp !== 'object') {
                        console.error('settings.remove: ' + tmp + ' is a value');
                        return false;
                    }
                } else {
                    return false;
                }
            }

            delete tmp[parts[$i]];
            return true;
        };

        var flatten = function (obj, result, path) {
            result = result || {};
            path = path || '';
            _(obj).each(function (prop, id) {
                if (_.isObject(prop) && !_.isArray(prop)) {
                    flatten(prop, result, path + id + '/');
                } else {
                    result[path + id] = prop;
                }
            });
            return result;
        };

        var fnChange = function (e, path, value) {
            this.set(path, value);
        };

        var that = {

            settingsPath: null,
            settingsBase: null,

            createModel: function (ModelClass) {

                return new ModelClass(settings)
                    .on('change', $.proxy(fnChange, this));
            },

            get: function (path, defaultValue) {
                if (!path) { // undefined, null, ''
                    return settings; //get(that.settingsPath);
                } else {
                    if (defaultValue === undefined) {
                        return get(path);
                    } else {
                        return contains(path) ? get(path) : defaultValue;
                    }
                }
            },

            set: function (path, value) {
                if (path) {
                    var orgpath = path;
                    set(path, value);
                }
            },

            remove: function (path) {
                if (path) {
                    path = (that.settingsPath + '/' + path);
                    remove(path);
                }
            },

            contains: function (path) {
                path = (that.settingsPath + '/' + path);
                return contains(path);
            },

            load: function () {
                // loader
                var load = function () {
                    return http.PUT({
                        module: 'jslob',
                        params: {
                            action: 'list'
                        },
                        data: ['apps/' + that.settingsBase + '/' + that.settingsPath]
                    }).done(function (data) {
                            settings = data[0].tree;
                        }).pipe(function () {
                            return settingsInitial(settings, that.settingsPath, that.settingsBase);
                        }).done(function () {
                            settingsCache.add(that.settingsPath, settings);
                        });
                };
                // trick to be fast: cached?
                if (!settingsCache) {
                    settingsCache = new cache.SimpleCache('settings', true);
                }

                return settingsCache.get(that.settingsPath)
                    .pipe(function (data) {
                        if (data !== null) {
                            settings = data;
                            return settings;
                        } else {
                            return load();
                        }
                    });
            },

            reset: function () {
                return settingsCache.remove(that.settingsPath).pipe(function () {
                    return http.PUT({
                        module: 'jslob',
                        params: {
                            action: 'set',
                            id: 'apps/' + that.settingsBase + '/' + that.settingsPath
                        },
                        data: {}
                    });
                });
            },

            save: function (external) {
                if (external !== undefined) {
                    settings = external;
                }
//                settingsInitial(settings, that.settingsPath, that.settingsBase, function () {
                settingsCache.add(that.settingsPath, settings);

                return http.PUT({
                    module: 'jslob',
                    params: {
                        action: 'set',
                        id: 'apps/' + that.settingsBase + '/' + that.settingsPath //id
                    },
                    data: settings
                });
//                });
            }
        };
        return that;
    };

    return {
        load: function (name, req, load, config) {
            var mywrapper = settingsWrapper();
            name = name.split('/');
            mywrapper.settingsBase = name[0];
            name = _.rest(name).join('/');
            mywrapper.settingsPath = name;
            mywrapper.load()
                .done(function () {
                    load(mywrapper);
                })
                .fail(function () {
                    console.error('failed to load settings for:' + mywrapper.settingsPath);
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

