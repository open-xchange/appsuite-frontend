/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/settings', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    var clone = function (obj) {
        // simple, fast, and robust
        if (_.isUndefined(obj)) {
            return undefined;
        }
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error(obj, e, e.stack);
            throw e;
        }
    };

    var getParts = function (key) {
        return _.isArray(key) ? key : String(key).split(/\//);
    };

    var get = function (source, path, defaultValue) {
        // no argument?
        if (path === undefined) { return clone(source); }
        // get parts
        var key, parts = getParts(path), tmp = source || {};
        while (parts.length) {
            key = parts.shift();
            if (!_.isObject(tmp) || !(key in tmp)) return defaultValue;
            tmp = tmp[key];
        }
        return clone(tmp);
    };

    // pending requests?
    var pending = {};

    var Settings = function (path, tree, meta) {

        var self = this, detached = false,
            saved = JSON.parse(JSON.stringify(tree || {}));

        tree = tree || {};
        meta = meta || {};

        this.get = function (path, defaultValue) {
            return get(tree, path, defaultValue);
        };

        this.meta = function (path) {
            return get(meta, path, {});
        };

        this.isConfigurable = function (path) {
            var meta = this.meta(path);
            // default is true!
            return 'configurable' in meta ? meta.configurable : true;
        };

        this.contains = function (path) {
            var key, parts = getParts(path), tmp = tree || {};
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
            var key, parts = getParts(path), tmp = tree || {}, notPlainObject;
            while (parts.length) {
                key = parts.shift();
                if (_.isObject(tmp)) {
                    if (parts.length) {
                        notPlainObject = !!create && (!_.isObject(tmp[key]) || _.isArray(tmp[key]));
                        tmp = notPlainObject ? (tmp[key] = {}) : tmp[key];
                    } else {
                        callback(tmp, key);
                    }
                } else break;
            }
        };

        this.set = function (path, value, options) {

            // options
            var opt = $.extend({
                silent: false
            }, options);

            // overwrite entire tree?
            if (arguments.length === 1 && _.isObject(path)) {
                tree = path;
                if (!opt.silent) self.trigger('reset', tree);
            } else {
                resolve(path, function (tmp, key) {
                    var previous = tmp[key],
                        isChange = JSON.stringify(value) !== JSON.stringify(previous);
                    if (value === undefined) {
                        delete tmp[key];
                    } else {
                        tmp[key] = value;
                    }
                    if (!isChange) return;
                    if (!opt.silent) self.trigger('change:' + path, value, previous).trigger('change', path, value, previous);
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
            // Note: This does not support a "deep" extend
            return require([path + '/settings/defaults']).then(function (defaults) {
                tree = _.extend({}, defaults, tree);
            });
        };

        var change = function (model) {
            _(model.changed).each(function (value, path) {
                self.set(path, value, { validate: true });
            });
        };

        // please note: doesn't trigger change events when manipulating
        // properties of objects (#48456). Use `settings.on('change', cb)` instead.
        this.createModel = function (ModelClass) {
            if (ox.debug) console.warn('createModel is deprecated');
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

            var data;

            function load() {
                return http.PUT({
                    module: 'jslob',
                    params: { action: 'list' },
                    data: [path]
                })
                .then(
                    function success(data) {
                        if (!detached) {
                            tree = data[0].tree;
                            meta = data[0].meta;
                            saved = JSON.parse(JSON.stringify(tree));
                            return applyDefaults();
                        }
                        return $.when();
                    },
                    function fail(e) {
                        tree = {};
                        meta = {};
                        saved = {};
                        detached = true;
                        console.error('Cannot load jslob', path, e);
                        return applyDefaults();
                    }
                )
                .then(function () {
                    self.trigger('load', tree, meta);
                    return { tree: tree, meta: meta };
                });
            }

            if (ox.rampup.jslobs && (data = ox.rampup.jslobs[path])) {
                // cache hit
                tree = data.tree;
                meta = data.meta;
                saved = JSON.parse(JSON.stringify(tree));
                return applyDefaults().then(function () {
                    return { tree: tree, meta: meta };
                });
            } else if (ox.online) {
                // online
                return load();
            }
            // offline
            self.detach();
            return $.Deferred().resolve({ tree: tree, meta: meta });
        };

        // reload settings from server
        // this does not trigger any change events!
        this.reload = function () {

            if (detached) return $.when();

            return http.PUT({ module: 'jslob', params: { action: 'list' }, data: [path] })
                .then(function (data) {
                    tree = data[0].tree;
                    meta = data[0].meta;
                    saved = JSON.parse(JSON.stringify(tree));
                    applyDefaults();
                    self.trigger('reload', tree, meta);
                    return { tree: tree, meta: meta };
                });
        };

        this.clear = function () {
            return http.PUT({
                module: 'jslob',
                params: { action: 'set', id: path },
                data: {}
            })
            .done(function () {
                tree = {};
                meta = {};
                self.trigger('reset');
            });
        };

        this.isPending = function () {
            return !!pending[path];
        };

        this.getAllPendingSettings = function () {
            return pending;
        };

        /**
         * Save settings to backend.
         *
         * You can use the request object to find out whether the save
         * attempt was successful.
         *
         * @return The deffered object of the request sent
         *
         */
        this.save = (function () {
            var request,
                sendRequest = function (data) {
                    request = http.PUT({
                        module: 'jslob',
                        params: { action: 'set', id: path },
                        data: data
                    })
                    .done(function () {
                        saved = JSON.parse(JSON.stringify(data));
                        self.trigger('save');
                    })
                    .fail(function (e) {
                        if (ox.debug) console.error('jslob:set', e);
                    })
                    .always(function () {
                        delete pending[path];
                    });
                },
                // limit to 5 seconds
                save = _.throttle(sendRequest, 5000);

            return function (custom, options) {

                // options
                var opt = $.extend({
                    force: false
                }, options);

                if (detached) console.warn('Not saving detached settings.', path);
                if (detached || (!custom && _.isEqual(saved, tree))) return $.when();

                var data = { tree: custom || tree, meta: meta };

                // don't save undefined
                if (data.tree === undefined) return $.when();

                pending[path] = this;

                if (opt.force) {
                    sendRequest(data.tree);
                } else {
                    save(data.tree);
                }
                return request;
            };
        }());

        /**
         * facade for this.save to notify user in case of errors
         * @return { deferred }
         */
        this.saveAndYell = function (custom, options) {
            var def = this.save(custom, options),
                //options
                opt = $.extend({
                    debug: false
                }, options);

            //debug
            if (opt.debug) {
                def.always(function () {
                    var list = _.isArray(this) ? this : [this];
                    _.each(list, function (current) {
                        if (current.state) {
                            console.warn('SAVEANDYELL: ' + current.state());
                        } else if (def.state) {
                            console.warn('SAVEANDYELL: ' + def.state());
                        }
                    });
                });
            }

            // yell on reject
            return def.fail(function (e) {
                require(['io.ox/core/notifications'], function (notifications) {
                    var obj = e || { type: 'error' };
                    //use obj.message for custom error message
                    notifications.yell(obj);
                });
            });
        };

        /**
         * Save settings to backend.
         *
         * Does the same .save(null, { force: true })
         * but assign a 'merge' action instead of 'set'
         *
         * @return The deffered object of the request sent
         *
         */
        this.merge = function (custom) {
            if (detached) console.warn('Not merging/saving detached settings.', path);
            if (detached || (!custom && _.isEqual(saved, tree))) return $.when();

            var treeData = custom || tree;

            // don't save undefined
            if (treeData === undefined) return $.when();

            pending[path] = this;

            return http.PUT({
                module: 'jslob',
                params: { action: 'update', id: path },
                data: treeData
            })
            .done(function () {
                saved = JSON.parse(JSON.stringify(treeData));
                self.trigger('save');
            })
            .always(function () {
                delete pending[path];
            });
        };

        _.extend(this, Backbone.Events);
    };

    return {
        load: function (name, req, load) {
            var settings = new Settings(name);
            settings.load().then(
                function loadSuccess() {
                    load(settings);
                },
                function loadFail() {
                    try {
                        load.error({});
                    } catch (e) {
                        console.error(e.message);
                    }
                    requirejs.undef('settings!' + name);
                }
            );
        }
    };
});

// define corresponding plugin now (not earlier)
(function () {
    'use strict';
    // just to fool build system.
    window[0 || 'define']('settings', ['io.ox/core/settings'], _.identity);
}());
