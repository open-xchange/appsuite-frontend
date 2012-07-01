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

define("settings", ['io.ox/core/http', 'io.ox/core/cache', 'io.ox/core/tk/model'], function (http, cache, Model) {

    'use strict';

    var settingsWrapper = function () {

        var globalSubpath = "gui/wurst/";
        var settings = {},
            settingsCache;

        var get = function (key) {
            console.log(arguments);
            var parts = key.split(/\//),
              tmp = settings || {};

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                } else {
                    tmp = null;
                    return null;
                }
            });
            return tmp;
        };

        var set = function (key, value) {

            var parts = key.split(/\//),
              tmp = settings || {},
              rkey = parts.pop();

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                    if (typeof tmp !== 'object') {
                        console.error('settings.set: ' + tmp + ' is a value');
                        return false;
                    }
                } else {
                    tmp[partname] = {};
                    tmp = tmp[partname];
                }
            });
            tmp[rkey] = value;
        };

        var contains = function (key) {
            var parts = key.split(/\//),
              tmp = settings || {};

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                } else {
                    return false;
                }
            });
            return true;
        };

        var remove = function (key) {
            var parts = key.split(/\//),
              tmp = settings || {},
              rkey = parts.pop();
            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                    if (typeof tmp !== 'object') {
                        console.error('settings.remove: ' + tmp + ' is a value');
                        return false;
                    }
                } else {
                    return false;
                }
            });

            delete [tmp[rkey]];
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
                // create & return model instance
                return new ModelClass({ data: flatten(this.get()) })
                    .on('change', $.proxy(fnChange, this));
            },

            get: function (path, defaultValue) {
                if (!path) { // undefined, null, ''
                    return get(globalSubpath + that.settingsPath);
                } else {
                    path = globalSubpath + that.settingsPath + '/' + path;
                    console.log('getting: ' + path);
                    if (defaultValue === undefined) {
                        return get(path);
                    } else {
                        return contains(path) ? get(path) : defaultValue;
                    }
                }
            },

            set: function (path, value, permanent) {
                if (path) {
                    var orgpath = path;
                    path = (globalSubpath + that.settingsPath + '/' + path);
                    console.log(path);
                    set(path, value);
                    if (permanent) {
                        // save settings path on server
                        settingsCache.add('settingsDefault', settings);
                        return http.PUT({
                            module: 'config/gui',
                            appendColumns: false,
                            processResponse: false,
                            data: settings
                        });
                    }
                }
            },

            remove: function (path) {
                if (path) {
                    path = (globalSubpath + that.settingsPath + '/' + path);
                    remove(path);
                }
            },

            contains: function (path) {
                path = (globalSubpath + that.settingsPath + '/' + path);
                return contains(path);
            },

            load: function () {
                // loader
                var load = function () {
                    return http.GET({
                            module: 'config/gui',
                            appendColumns: false,
                            processResponse: false
                        })
                        .done(function (data) {
                            settings = data !== undefined ? data.data : {};
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
                settingsCache.add('settingsDefault', settings);
                console.log(settings);
                return http.PUT({
                    module: 'config/gui',
                    appendColumns: false,
                    processResponse: false,
                    data: settings
                });
            }
        };
        return that;
    };

    return {
        load: function (name, req, load, config) {
            var mywrapper = settingsWrapper();
            mywrapper.settingsPath = name; //encodeURIComponent(name);
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
