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
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

define('io.ox/multifactor/auth', [
    'io.ox/multifactor/api',
    'io.ox/multifactor/views/selectDeviceView',
    'io.ox/multifactor/deviceAuthenticator'
], function (api, selectDeviceView, deviceAuthenticator) {

    'use strict';

    var authenticating = false;

    var auth = {

        getAuthentication: function () {
            if (authenticating) {
                return $.when();
            }
            authenticating = true;
            var def = $.Deferred();
            api.getDevices().then(function (list) {
                if (list && list.length > 0) {
                    if (list && list.length > 1) {
                        selectDeviceView.open(list, def);
                    } else {
                        var device = list[0];
                        deviceAuthenticator.getAuth(device.provider.name, device.id, def);
                    }
                } else {
                    def.reject();
                }

            });
            return def;
        },

        doAuthentication: authenticate

    };

    function authenticate() {
        var def = $.Deferred();
        auth.getAuthentication().then(function (data) {
            authenticating = false;
            if (data) {
                api.doAuth(data.provider, data.id, data.response).then(function (data) {
                    def.resolve(data);
                }, function (rejection) {
                    if (rejection === 'AUTHENTICATION_DENIED') {
                        authenticate().then(def.resolve, def.reject);
                    } else {
                        def.reject();
                    }
                });
            } else {
                def.reject();
            }
        }, def.reject);
        return def;
    }

    return auth;

});

