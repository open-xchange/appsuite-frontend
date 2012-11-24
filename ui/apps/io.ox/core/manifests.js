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

define.async('io.ox/core/manifests', ['io.ox/core/extensions', 'io.ox/core/http', 'io.ox/core/cache'], function (ext, http, cache) {
    'use strict';
    // TODO: Caching and Update Handling


    var def = new $.Deferred();


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
            return requirements.concat(_(this.pluginPoints[pointName]).pluck("path"));
        },
        pluginsFor: function (pointName) {
            if (!this.pluginPoints[pointName] || this.pluginPoints[pointName].length === 0) {
                return [];
            }
            return [].concat(_(this.pluginPoints[pointName]).pluck("path"));
        },
        apps: {},
        plugins: {},
        pluginPoints: {},
        loader: 'none'
    };

    ox.withPluginsFor = function (pointName, requirements) {
        return manifestManager.withPluginsFor(pointName, requirements);
    };

    ox.manifests = manifestManager;

    var fnStoreState = function () {
        if (!ox.signin) {
            manifestCache.add('default', [manifestManager.apps, manifestManager.plugins, manifestManager.pluginPoints]);
        }
    };

    var fnLoadState = function () {
        return manifestCache.get('default').done(function (o) {
            if (!o) {
                return;
            }
            if (manifestCache.loader === 'backend') {
                def.resolve(manifestManager); // Whoever resolves first, wins
                return; // Backend already fetched everything
            }
            manifestManager.apps = o[0];
            manifestManager.plugins = o[1];
            manifestManager.pluginPoints = o[2];
            manifestManager.loader = 'cache';
            def.resolve(manifestManager); // Whoever resolves first, wins
        });
    };

    var fnProcessManifest = function (manifest) {
        if (manifest.namespace) {
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
    };

    var fnLoadStaticFiles = function (state) {
        require([ox.base + "/src/manifests.js", "io.ox/core/capabilities"], function (manifests, capabilities) {
            manifestManager.loader = 'backend';
            _(manifests).each(function (manifest) {
                if (!!! manifest.requires || capabilities.has(manifest.requires)) {
                    fnProcessManifest(manifest);
                }
            });
            fnStoreState();
            def.resolve(manifestManager); // Whoever resolves first, wins
        }).fail(function () {
            if (state === 'success') {
                fnStoreState();
            }
            def.resolve(manifestManager); // Whoever resolves first, wins
        });
    };

    var fnLoadBackendManifests = function () {
        http.GET({
            module: 'apps/manifests',
            params: {
                action: 'all'
            }
        }).done(function (manifests) {
            manifestManager.loader = 'backend';
            _(manifests).each(fnProcessManifest);
            // Load Manifest Extensions
            manifestManager.loadPluginsFor('manifests').done(function () {
                // Apply Extensions
                ext.point("io.ox/core/manifests").invoke('customize', manifestManager);
                fnLoadStaticFiles('success');
            });

        }).fail(function (resp) {
            fnLoadStaticFiles('fail');
        });
    };

    // Try the cache and the backend
    // First one resolves this module
    fnLoadState();
    fnLoadBackendManifests();

    return def;
    
});