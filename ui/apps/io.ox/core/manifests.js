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

define('io.ox/core/manifests',
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/capabilities'
    ], function (ext, http, cache, capabilities) {

    'use strict';

    // TODO: Caching and Update Handling
    var manifestCache = new cache.SimpleCache("manifests", true);

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

    // var fnClear = function () {
    //     manifestManager.apps = {};
    //     manifestManager.plugins = {};
    //     manifestManager.pluginPoints = {};
    // };

    // var fnLoadStaticFiles = function (state) {
    //     require([ox.base + "/src/manifests.js"], function (manifests) {
    //         manifestManager.loader = 'backend';
    //         if (state !== 'success') {
    //             fnClear();
    //         }
    //         _(manifests).each(function (manifest) {
    //             if (!!! manifest.requires || capabilities.has(manifest.requires)) {
    //                 fnProcessManifest(manifest);
    //             }
    //         });
    //         fnStoreState();
    //         def.resolve(manifestManager); // Whoever resolves first, wins
    //     }).fail(function () {
    //         if (state === 'success') {
    //             fnStoreState();
    //         }
    //         def.resolve(manifestManager); // Whoever resolves first, wins
    //     });
    // };

    // var fnLoadBackendManifests = function () {
    //     http.GET({
    //         module: 'apps/manifests',
    //         params: {
    //             action: 'all'
    //         }
    //     }).done(function (manifests) {
    //         _(manifests).each(fnProcessManifest);
    //         // Load Manifest Extensions
    //         manifestManager.loadPluginsFor('manifests').done(function () {
    //             // Apply Extensions
    //             ext.point("io.ox/core/manifests").invoke('customize', manifestManager);
    //             fnLoadStaticFiles('success');
    //         });

    //     }).fail(function (resp) {
    //         fnLoadStaticFiles('fail');
    //     });
    // };

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

    var self = {

        load: function () {

            function load() {
                return $.when(
                    http.GET({ module: 'apps/manifests', params: { action: 'all' } }),
                    ox.signin ? $.when() : require([ox.base + "/src/manifests.js"])
                )
                .pipe(function (server, source) {
                    return ox.signin ? server[0] : server[0].length ? server[0] : source;
                });
            }

            if (ox.online) {
                return load();
            } else {
                // use cache in offline mode only
                return manifestCache.get('default').done(function (data) {
                    if (data !== null) {
                        _.extend(manifestManager, data);
                    }
                });
            }
        },

        initialize: function () {

            return $.when(
                self.load(),
                capabilities.initialize()
            )
            .done(function (data) {
                if (data !== null) {
                    _(data).each(process);
                    if (!ox.signin) {
                        manifestCache.add('default', {
                            apps: manifestManager.apps,
                            plugins: manifestManager.plugins,
                            pluginPoints: manifestManager.pluginPoints
                        });
                    }
                }
                // Load Manifest Extensions
                manifestManager.loadPluginsFor('manifests').done(function () {
                    // Apply Extensions
                    ext.point("io.ox/core/manifests").invoke('customize', manifestManager);
                });
            });
        },

        manager: manifestManager
    };

    return self;
});
