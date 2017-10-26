/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/api', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    var cache = {
        config: {},
        onboardingDevices: ox.rampup ? ox.rampup.onboardingDevices : undefined
    };

    window.c = cache;
    var api = {

        enabledDevices: function () {
            if (cache.onboardingDevices) return $.when(cache.onboardingDevices);

            return api.config().then(function (config) {
                var f = {};
                _(config.devices).each(function (device) {
                    f[device.id] = device.enabled;
                });
                cache.onboardingDevices = f;
                return f;
            });
        },

        config: function (device) {
            if (!device && !_.isEmpty(cache.config)) return $.when(cache.config);
            if (device && cache.config[device]) return $.when(cache.config[device]);

            return http.GET({
                module: 'onboarding',
                params: {
                    action: 'config',
                    client: device
                }
            }).then(function (config) {

                if (device) {
                    cache.config[device] = config;
                } else {
                    cache.config = config;
                }
                return config;
            });
        },

        execute: function (scenario, action, data) {
            return http.PUT({
                module: 'onboarding',
                params: {
                    action: 'execute',
                    id: scenario,
                    action_id: action
                },
                data: data,
                // get warnings
                processResponse: false
            });
        },

        getUrl: function (scenario, action, client) {
            return ox.apiRoot + '/onboarding?action=execute' +
                    '&id=' + scenario +
                    '&action_id=' + action +
                    '&client=' + (client || '') +
                    '&session=' + ox.session;
        }
    };

    return api;
});
