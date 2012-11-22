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

define.async('io.ox/core/manifests', ['io.ox/core/extensions', 'io.ox/core/http'], function (ext, http) {
    'use strict';
    // TODO: Caching and Update Handling


    var def = new $.Deferred();


    var apps = {},
        plugins = {},
        pluginPoints = {};



    var manifestManager = {
        loadPluginsFor: function (pointName, cb) {
            cb = cb || $.noop;
            if (!pluginPoints[pointName] || pluginPoints[pointName].length === 0) {
                cb();
                return $.when();
            }
            var requirements = _(pluginPoints[pointName]).pluck("path");

            return require(requirements, cb);
        },
        withPluginsFor: function (pointName, requirements) {
            requirements = requirements || [];
            if (!pluginPoints[pointName] || pluginPoints[pointName].length === 0) {
                return requirements;
            }
            return requirements.concat(_(pluginPoints[pointName]).pluck("path"));
        },
        pluginsFor: function (pointName) {
            if (!pluginPoints[pointName] || pluginPoints[pointName].length === 0) {
                return [];
            }
            return [].concat(_(pluginPoints[pointName]).pluck("path"));
        },
        apps: apps,
        plugins: plugins,
        pluginPoints: pluginPoints
    };

    ox.withPluginsFor = function (pointName, requirements) {
        return manifestManager.withPluginsFor(pointName, requirements);
    };

    ox.manifests = manifestManager;

    var fnProcessManifest = function (manifest) {
        if (manifest.namespace) {
            // Looks like a plugin
            if (!pluginPoints[manifest.namespace]) {
                pluginPoints[manifest.namespace] = [];
            }
            pluginPoints[manifest.namespace].push(manifest);
            plugins[manifest.path] = manifest;
        } else {
            // Looks like an app
            apps[manifest.path] = manifest;
        }
    };

    var fnLoadStaticFiles = function () {
        require([ox.base + "/src/manifests.js"], function (manifests) {
            _(manifests).each(fnProcessManifest);
            def.resolve(manifestManager);
        }).fail(function () {
            def.resolve(manifestManager);
        });
    };

    // Ask the backend
    if (ox.session) {
        http.GET({
            module: 'apps/manifests',
            params: {
                action: 'all'
            }
        }).done(function (manifests) {
            _(manifests).each(fnProcessManifest);
            // Load Manifest Extensions
            manifestManager.loadPluginsFor('manifests').done(function () {
                // Apply Extensions
                ext.point("io.ox/core/manifests").invoke('customize', manifestManager);
                fnLoadStaticFiles();
            });

        }).fail(function (resp) {
            console.warn("Could not load backend manifests", resp);
            fnLoadStaticFiles();
        });
    } else {
        fnLoadStaticFiles();
    }

    return def;
    
});