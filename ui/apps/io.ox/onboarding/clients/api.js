/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/api', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    return {

        config: function () {
            return http.GET({
                module: 'onboarding',
                params: { action: 'config' }
            }).then(function (data) {
                // TODO: remove when backend is ready
                // fix wrong identifiers
                _.each(data.matching, function (match) {
                    if (match.id.indexOf('mailappinstall') > -1) match.actions = ['link/mailappinstall'];
                    if (match.id.indexOf('driveappinstall') > -1) match.actions = ['link/driveappinstall'];
                    if (match.id.indexOf('mailmanual') > -1) match.actions = ['display/mailmanual'];
                });
                _.each(_.where(data.devices, { id: 'apple.mac' }), function (device) {
                    device.scenarios = _.without(device.scenarios, 'apple.mac/mailappinstall', 'apple.mac/driveappinstall');
                });
                return data;
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
                data: data
            });
        },

        getUrl: function (scenario, action) {
            return ox.apiRoot + '/onboarding?action=execute' +
                    '&id=' + scenario +
                    '&action_id=' + action +
                    '&session=' + ox.session;
        }
    };
});
