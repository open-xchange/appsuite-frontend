/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

            // you can pass separate arguments as arrays and if two operands are not connected by an operator an && is automatically inserted
            var str = _(arguments).flatten().join(' && ').replace(/([^&|]) ([^&|])/gi, '$1 && $2').toLowerCase(),
                condition = str.replace(/[a-z0-9_:\-./]+/ig, function (match) {
                    return api.isDisabled(match) ? false : (match in capabilities);
                });
            if (!str || arguments[0] === false) return true;
            try {
                /*eslint no-new-func: 0*/
                return new Function('return !!(' + condition + ')')();
            } catch (e) {
                if (_.device('!karma')) console.error('capabilities.has()', str, e);
                return false;
            }
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

    // custom cap
    var cap = [], cookie = _.getCookie('cap');
    // via local.conf?
    if (ox.cap) cap = ox.cap.split(/\s*[, ]\s*/);
    // via cookie?
    if (cookie) cap = cap.concat(cookie.replace(/[^a-z0-9_:\-./]/g, '').split(/\s*[, ]\s*/));
    // via URL parameter?
    var hash = _.url.hash('ref') ? _.deserialize(_.url.hash('ref')) : _.url.hash();
    if (hash.cap) cap = cap.concat(hash.cap.replace(/[^a-z0-9_:\-./]/g, '').split(/\s*[, ]\s*/));

    _(cap).each(function (id) {
        if (id[0] === '-') {
            id = id.substr(1);
            disabled[id] = true;
        } else {
            capabilities[id] = added[id] = {
                attributes: {},
                backendSupport: false,
                id: id
            };
            delete disabled[id];
            console.info('Enabled feature', id);
        }
    });

    // disable via hash?
    if (hash.disableFeature) {
        _(hash.disableFeature.split(/\s*[, ]\s*/)).each(function (id) {
            disabled[id] = true;
        });
    }

    // log
    var caps = _(disabled).keys().sort();
    if (caps.length) console.info('Disabled capabilities: ' + caps.join(', '));

    // flat report
    api.getFlat = function () {
        var capcur = _.pluck(api.get(), 'id').sort(),
            data = { enabled: [], disabled: [], mismatch: [] };
        _.each(capcur, function (id) {
            if (api.has(id)) {
                data.enabled.push(id);
            } else {
                data.disabled.push(id);
            }
        });
        return data;
    };

    return api;
});
