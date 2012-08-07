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
 */

define("settings", ['io.ox/core/http', 'io.ox/core/cache',
                    'io.ox/core/tk/model'], function (http, cache, Model) {

    'use strict';

    var settingsWrapper = function () {

        var settings = {},
            settingsCache,
            settingsDefaults;

        var settingsInitial = function (settings, path) {
            require(['io.ox/' + path + '/settings/defaults'], function (u) {
                settingsDefaults = u;
            });
            _.each(settingsDefaults, function (value, key) {
                if (settings[key] === undefined) {
                    settings[key] = settingsDefaults[key];
                }
            });
        };

        var get = function (key) {
            var parts = key.split(/\//),
            tmp = settings || {}, i = 0, $i = parts.length;
//            for (; i < $i; i++) {
//                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty([i]) && typeof tmp[i] !== 'undefined' && tmp[i] !== null);
//                if (tmpHasSubNode) {
//                    tmp = tmp[i];
//                } else {
//                    tmp = null;
//                    return null;
//                }
//            }
            return tmp[key];
        };

        var set = function (key, value) {
            var tmp = settings || {};
            tmp[key] = value;
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

            createModel: function (ModelClass) {

                return new ModelClass({ data: settings })
                    .on('change', $.proxy(fnChange, this));
            },

            get: function (path, defaultValue) {
                if (!path) { // undefined, null, ''
                    return get(that.settingsPath);
                } else {
                    console.log('getting: ' + path);
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
                    console.log(path);
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
                        data: ['apps/io.ox/' + that.settingsPath]
                    }).done(function (data) {
                            settings = data[0].tree;
                            settingsCache.add('settingsDefault', settings);
                        });
                };
                // trick to be fast: cached?
                if (!settingsCache) {
                    settingsCache = new cache.SimpleCache('settings', true);
                }

                return settingsCache.get('settingsDefault')
                    .pipe(function (data) {
                        if (data !== null) {
                            settings = data;
                            load();
                            return settings;
                        } else {
                            return load();
                        }
                    });
            },
            save: function () {
                settingsInitial(settings, [that.settingsPath]);
                settingsCache.add('settingsDefault', settings);
                console.log(settings);
                return http.PUT({
                    module: 'jslob',
                    params: {
                        action: 'update',
                        id: 'apps/io.ox/' + that.settingsPath //id
                    },
                    data: settings
                });
            }
        };
        return that;
    };

    return {
        load: function (name, req, load, config) {
            var mywrapper = settingsWrapper();
            name = name.split('/');
            mywrapper.settingsPath = name[1]; //encodeURIComponent(name);
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
