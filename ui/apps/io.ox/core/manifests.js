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

define.async('io.ox/core/manifests', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities'
], function (ext, capabilities) {

    'use strict';

    var manifestManager = {

        // convenience function
        // returns 'requires' of a given app or plugin id
        // useful for upsell stuff
        getRequirements: function (id) {
            validate();
            return (this.plugins[id] || {}).requires || '';
        },

        loadPluginsFor: function (pointName, cb) {
            cb = cb || $.noop;
            validate();
            if (!this.pluginPoints[pointName] || this.pluginPoints[pointName].length === 0) {
                cb();
                return $.when();
            }
            var requirements = _(this.pluginPoints[pointName]).pluck('path');
            return require(requirements, cb);
        },

        withPluginsFor: function (name, deps) {
            return (deps || []).concat(this.pluginsFor(name));
        },

        hasPluginsFor: function (name) {
            validate();
            var plugins = this.pluginPoints[name];
            return plugins && plugins.length > 0;
        },

        pluginsFor: function (name) {
            validate();
            var plugins = this.pluginPoints[name];
            if (!plugins || plugins.length === 0) return [];
            return [].concat(_(plugins).chain().pluck('path').uniq().value());
        },

        wrapperFor: function (pointName, dependencies, definitionFunction) {
            var self = this;
            var pluginAware = _(dependencies).contains('plugins');

            if (pluginAware) {
                // Plugin aware!
                // Require the plugins asynchronously and pass plugin data to the module
                var index = _(dependencies).indexOf('plugins');
                var newDependencies = dependencies.slice(0, index).concat(dependencies.slice(index + 1));
                return {
                    dependencies: newDependencies,
                    definitionFunction: function () {
                        var args = $.makeArray(arguments),
                            plugins = {
                                loading: $.Deferred(),
                                names: self.pluginsFor(pointName)
                            };
                        args = args.slice(0, index).concat([plugins]).concat(args.slice(index));
                        var moduleDef = definitionFunction.apply(this, args);

                        require(plugins.names).done(plugins.loading.resolve).fail(plugins.loading.reject);

                        return moduleDef;
                    }
                };
            }
            // Not explicitely plugin aware, so, let's require everything beforehand
            return {
                dependencies: this.withPluginsFor(pointName, dependencies),
                definitionFunction: definitionFunction,
                after: this.pluginsFor('after:' + pointName)
            };
        },
        isDisabled: function (path) {
            if (ox.debug) console.warn('This method is deprecated and should not be used any longer.');
            validate();
            return !this.plugins[path];
        },
        plugins: null,
        pluginPoints: null
    };

    ox.withPluginsFor = function (pointName, requirements) {
        return manifestManager.withPluginsFor(pointName, requirements);
    };

    ox.manifests = manifestManager;

    function isDisabled(manifest) {
        return (manifest.requires && manifest.upsell !== true) &&
               !capabilities.has(manifest.requires) ||
               // check device. this check cannot be bypassed by upsell=true
               (!!manifest.device && !_.device(manifest.device));
    }

    function process(manifest) {

        if (!manifest.namespace) {
            if (ox.debug) console.warn('Looks like an app is defined "the old way". Apps can not be defined in manifest files any longer, but should be defined explicitly in code.', manifest);
            return;
        }

        // take care of plugins:

        // lacks path or namespace?
        if (!manifest.path) {
            console.warn('Cannot process plugin manifest without a path', manifest);
            return;
        }

        // check capabilities. skip this if upsell=true.
        // Such plugins take care of missing capabilities own their own
        if (isDisabled(manifest)) return;

        // loop over namespaces (might be multiple)
        // supports: 'one', ['array'] or 'one two three'
        _([].concat(manifest.namespace)).each(function (namespace) {
            _(namespace.split(/\s+,?/)).each(function (namespace) {
                // Looks like a plugin
                var p = manifestManager.pluginPoints;
                // add to queue
                (p[namespace] = p[namespace] || []).push(manifest);
                manifestManager.plugins[manifest.path] = manifest;
            });
        });
    }

    var ts = _.now(), custom = [];

    var self = {
        manager: manifestManager,
        reset: function () {
            manifestManager.plugins = null;
            manifestManager.pluginPoints = null;
        }
    };

    function validate() {

        if (manifestManager.plugins) return;

        manifestManager.pluginPoints = {};
        manifestManager.plugins = {};

        _(ox.serverConfig.manifests).each(process);

        if (_.url.hash('customManifests')) {
            _(custom).each(process);
        }

        if (!_.isEmpty(manifestManager.pluginPoints)) ox.trigger('manifests');
    }

    var def = $.Deferred();

    if (_.url.hash('customManifests')) {
        require([ox.base + '/manifests/open-xchange-appsuite.json?t=' + ts], function (list) {
            custom = list;
            console.info('Loading custom manifests', _(list).pluck('path'), list);
            def.resolve(self);
        });
    } else {
        def.resolve(self);
    }

    return def.promise();
});
