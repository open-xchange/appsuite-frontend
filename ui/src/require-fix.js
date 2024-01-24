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

/* eslint requirejs/no-invalid-require: 0, requirejs/no-invalid-define: 0 */

requirejs.onError = function (e) {
    console.error('requirejs', e.message, arguments);
};
// Override nextTick to enable collection of dependencies for concatenation.
(function () {
    var timeout = null, finalCallback = null;
    require.nextTick = function (fn, finalCb) {
        if (finalCb) finalCallback = finalCb;
        if (fn) setTimeout(fn, 4);
        require.delayTick();
    };
    require.delayTick = function () {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function () {
            if (!finalCallback) return;
            var cb = finalCallback;
            finalCallback = null;
            cb();
        }, 4);
    };
    _.each(require.s.contexts, function (context) {
        context.nextTick = require.nextTick;
    });
}());

// init require.js
require({
    // inject version
    baseUrl: ox.base + '/apps',
    // use 15 seconds as base or hash param to tweak the timeout
    waitSeconds: document.cookie.indexOf('selenium=true') !== -1 ? (60 * 10) : (_.url.hash('waitSeconds') || 15)
});

// jQuery AMD fix
define('jquery', function () { return $; });

/**
 * Asynchronous define (has same signature than define)
 * Callback must return deferred object.
 */
define.async = (function () {

    var getLoader = function (name, deps, callback) {
        return function (n, req, onLoad) {
            // resolve module dependencies
            req(deps, function () {
                // get module (must return deferred object)
                var def = callback.apply(null, arguments);
                if (def && def.done) {
                    def.done(onLoad);
                } else {
                    console.error('Module "' + name + '" does not return a deferred object!');
                }
                name = deps = callback = null;
            });
        };
    };

    return function (name, deps, callback) {
        // use loader plugin to defer module definition
        define(name + ':async', { load: getLoader(name, deps, callback) });
        // define real module - will wait for promise
        define(name, [name + ':async!'], _.identity);
    };

}());

//
// Override define
//
(function () {

    var define = window.define;

    window.define = function (name, deps, callback) {

        // call original define if
        // a) we don't know the name or
        // b) it's io.ox/core/notifications (for whatever reason) or
        // c) if the second argument is string, i.e. provides plain content, or
        // d) or if the second argument is an object, i.e. a plugin definition.
        if (!_.isString(name) || name === 'io.ox/core/notifications' || (!_.isFunction(deps) && !_.isArray(deps))) return define.apply(this, arguments);

        // shift arguments?
        if (arguments.length === 2) {
            callback = deps;
            deps = [];
        }

        if (!ox.manifests || ox.manifests.hasPluginsFor(name)) {
            // we always resolve injected dependencies via a placeholder
            // in order to avoid UI freezes just because a plugin is missing
            deps.push(name + ':placeholder!');
            define(name + ':placeholder', { load: getPluginLoader(name) });
        }

        return define.call(this, name, deps, callback);
    };

    function getPluginLoader(name) {

        return function resolveInjectedDependecies(n, req, done) {
            // still no manifests? (only applies for very basic modules)
            if (!ox.manifests) return done();
            // try again: require further dependencies
            var deps = ox.manifests.pluginsFor(name);
            if (deps.length) {
                // resolve dependencies and respond to failures
                req(deps, done, function fail(e) {
                    // print error message but continue!
                    // not restricted to ox.debug; a missing dependency should be recognizable
                    console.error('Unable to resolve injected dependencies for module "' + name + '". Dependencies:', deps, e.message);
                    done();
                });
            } else {
                // we're done if nothing to inject
                done();
            }
        };
    }

    // copy other properties
    _.extend(window.define, define);

})();
