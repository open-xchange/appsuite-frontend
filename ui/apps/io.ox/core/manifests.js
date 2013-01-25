/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define.async('io.ox/core/manifests',
    ['io.ox/core/extensions',
     'io.ox/core/capabilities'
    ], function (ext, capabilities) {

    'use strict';

    var manifestManager = {

        loadPluginsFor: function (pointName, cb) {
            cb = cb || $.noop;
            if (!this.pluginPoints[pointName] || this.pluginPoints[pointName].length === 0) {
                cb();
                return $.when();
            }
            var requirements = _(this.pluginPoints[pointName]).pluck("path");
            return require(requirements, cb);
        },

        withPluginsFor: function (pointName, requirements) {
            requirements = requirements || [];
            if (!this.pluginPoints[pointName] || this.pluginPoints[pointName].length === 0) {
                return requirements;
            }
            return requirements.concat(_(this.pluginPoints[pointName]).chain().pluck("path").uniq().value());
        },

        pluginsFor: function (pointName) {
            if (!this.pluginPoints[pointName] || this.pluginPoints[pointName].length === 0) {
                return [];
            }
            return [].concat(_(this.pluginPoints[pointName]).pluck("path"));
        },

        wrapperFor: function (pointName, dependencies, definitionFunction) {
            var self = this;
            var pluginAware = _(dependencies).contains("plugins");

            if (pluginAware) {
                // Plugin aware!
                // Require the plugins asynchronously and pass plugin data to the module
                var index = _(dependencies).indexOf("plugins");
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
            } else {
                // Not explicitely plugin aware, so, let's require everything beforehand
                return {
                    dependencies: this.withPluginsFor(pointName, dependencies),
                    definitionFunction: definitionFunction
                };
            }
        },
        apps: {},
        plugins: {},
        pluginPoints: {}
    };

    ox.withPluginsFor = function (pointName, requirements) {
        return manifestManager.withPluginsFor(pointName, requirements);
    };

    ox.manifests = manifestManager;

    function process(manifest) {
        if (manifest.namespace) {
            if (manifest.requires) {
                if (!capabilities.has(manifest.requires)) {
                    return;
                }
            }
            var namespaces = manifest.namespace;
            if (!_.isArray(namespaces)) {
                namespaces = [manifest.namespace];
            }
            _(namespaces).each(function (namespace) {
                _(namespace.split(/\s+,?/)).each(function (namespace) {
                    // Looks like a plugin
                    if (!manifestManager.pluginPoints[namespace]) {
                        manifestManager.pluginPoints[namespace] = [];
                    }
                    manifestManager.pluginPoints[namespace].push(manifest);
                    manifestManager.plugins[manifest.path] = manifest;
                });
            });
        } else {
            // Looks like an app
            manifestManager.apps[manifest.path] = manifest;
        }
    }

    _(ox.serverConfig.manifests).each(process);

    var ts = _.now();

    var self = {
        manager: manifestManager,
        reset: function () {
            manifestManager.pluginPoints = {};
            manifestManager.plugins = {};
            manifestManager.apps = {};
            
            _(ox.serverConfig.manifests).each(process);
            if (_.url.hash('customManifests')) {
                console.info("Loading custom manifests");
                _(require(ox.base + "/src/manifests.js?t=" + ts)).each(function (m) {
                    console.info("Custom manifest", m);
                    process(m);
                });
            }
        }
    };

    if (_.url.hash('customManifests')) {
        var def = $.Deferred();
        require([ox.base + "/src/manifests.js?t=" + ts], function (m) {
            _(m).each(process);
            def.resolve(self);
        });
        return def;
    } else {
        return $.Deferred().resolve(self);
    }

    return $.Deferred().resolve(self);
});
