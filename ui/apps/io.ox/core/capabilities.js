/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

/**
* Usage:
* if (capabilities.has('calendar withBackendSupport'))) { ... } else { ... }
*/

define('io.ox/core/capabilities', function () {

    'use strict';

    var capabilities = {}, added = {}, disabled = {};

    var api = {

        get: function (id) {
            if (arguments.length === 0) {
                return capabilities;
            }
            id = String(id).toLowerCase();
            return capabilities[id];
        },

        isDisabled: function (id) {
            return id in disabled;
        },

        has: function () {

            var list = _(_(arguments).flatten()).map(function (def) {
                if (!def) {
                    return '';
                }
                return def.split(/\s*[, ]\s*/);
            });

            list = _(list).flatten();

            return _(list).all(function (id) {
                var inverse = false, result;
                if (id[0] === '!') {
                    id = id.substr(1);
                    inverse = true;
                }
                result = api.isDisabled(id) ? false : (id in capabilities);
                return inverse ? !result : result;
            });
        },

        reset: function () {
            // consider "added" hash
            capabilities = _.extend({}, added);
            // loop over array
            _(ox.serverConfig.capabilities).each(function (obj) {
                capabilities[obj.id] = obj;
            });
        }
    };

    api.reset();

    var hash = _.url.hash('cap');
    if (hash) {
        _(hash.split(/\s*[, ]\s*/)).each(function (id) {
            if (id[0] === '-') {
                id = id.substr(1);
                disabled[id] = true;
                console.info('Disabled feature', id);
            } else {
                capabilities[id] = added[id] = {
                    attributes: {},
                    backendSupport: false,
                    id: id
                };
                console.info('Enabled feature', id);
            }
        });
    }

    // disable via hash?
    hash = _.url.hash('disableFeature');
    if (hash) {
        _(hash.split(/\s*[, ]\s*/)).each(function (id) {
            disabled[id] = true;
        });
        if (!_.isEmpty(disabled)) {
            console.info('Disabled features', disabled);
        }
    }

    return api;
});
