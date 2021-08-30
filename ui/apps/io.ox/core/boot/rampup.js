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

define('io.ox/core/boot/rampup', [
    'io.ox/core/http',
    'io.ox/core/extensions'
], function (http, ext) {
    'use strict';

    function storeIn(origData, path) {
        return function (data) {
            path.split('//').reduce(function (obj, key, index, arr) {
                obj[key] = obj[key] || {};
                if (index === arr.length - 1) {
                    obj[key] = data;
                }
                return obj[key];
            }, origData);
        };
    }

    ext.point('io.ox/core/boot/rampup').extend([{
        id: 'exit_early',
        fetch: function (baton) {
            if (_.isEmpty(ox.rampup)) return;
            var debug = require('io.ox/core/boot/util').debug;
            debug('skipping rampup extensions, already got data', ox.rampup);
            baton.stopPropagation();
            baton.preventDefault();
            baton.data = ox.rampup;
        }
    }, {
        id: 'http_pause',
        fetch: function () {
            http.pause();
        }
    }, {
        id: 'jslobs',
        fetch: function (baton) {
            baton.data.jslobs = {};
            require(['settings!io.ox/caldav']).then(storeIn(baton.data, 'jslobs//io.ox/caldav'));
            require(['settings!io.ox/calendar']).then(storeIn(baton.data, 'jslobs//io.ox/calendar'));
            require(['settings!io.ox/contacts']).then(storeIn(baton.data, 'jslobs//io.ox/contacts'));
            require(['settings!io.ox/core']).then(storeIn(baton.data, 'jslobs//io.ox/core'));
            require(['settings!io.ox/core/updates']).then(storeIn(baton.data, 'jslobs//io.ox/core/updates'));
            require(['settings!io.ox/files']).then(storeIn(baton.data, 'jslobs//io.ox/files'));
            require(['settings!io.ox/mail']).then(storeIn(baton.data, 'jslobs//io.ox/mail'));
            require(['settings!io.ox/tasks']).then(storeIn(baton.data, 'jslobs//io.ox/tasks'));
        }
    }, {
        id: 'user config',
        fetch: function () {
            require(['io.ox/core/boot/config']).then(function (config) { return config.user(); });
        }
    }, {
        id: 'oauth',
        fetch: function (baton) {
            http.GET({
                module: 'oauth/accounts',
                params: { action: 'all' }
            }).then(storeIn(baton.data, 'oauth//accounts'));
            http.GET({
                module: 'oauth/services',
                params: { action: 'all' }
            }).then(storeIn(baton.data, 'oauth//services'));
        }
    }, {
        id: 'onboardingDevices',
        fetch: function (baton) {
            http.GET({
                module: 'onboarding',
                params: { action: 'config' }
            }).then(function (data) {
                var onboardingDevices = {};
                _(data.devices).each(function (device) {
                    onboardingDevices[device.id] = device.enabled;
                });
                return onboardingDevices;
            }).then(storeIn(baton.data, 'onboardingDevices'));
        }
    }, {
        id: 'user',
        fetch: function (baton) {
            http.GET({
                module: 'user',
                params: { action: 'get', id: baton.sessionData.user_id }
            }).then(storeIn(baton.data, 'user'));
        }
    }, {
        id: 'accounts',
        fetch: function (baton) {
            http.GET({
                module: 'account',
                params: { action: 'all' }
            }).then(storeIn(baton.data, 'accounts'));
        }
    }, {
        id: 'http_resume',
        fetch: function () {
            return http.resume();
        }
    }]);
});
