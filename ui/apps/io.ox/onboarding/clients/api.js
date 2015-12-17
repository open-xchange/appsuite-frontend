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
