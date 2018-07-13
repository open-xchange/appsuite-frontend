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
    'io.ox/multifactor/deviceAuthenticator',
    'gettext!multifactor'
], function (api, selectDeviceView, deviceAuthenticator, gt) {

    'use strict';

    var authenticating = false;

    var auth = {

        getAuthentication: function (error) {
            if (authenticating) {
                return $.when();
            }
            authenticating = true;
            var def = $.Deferred();
            api.getDevices().then(function (list) {
                if (list && list.length > 0) {
                    if (list && list.length > 1) {
                        selectDeviceView.open(list, def, error);
                    } else {
                        var device = list[0];
                        deviceAuthenticator.getAuth(device.provider.name, device.id, def, error);
                    }
                } else {
                    def.reject();
                }

            });
            return def;
        },

        doAuthentication: authenticate

    };

    function authenticate(error) {
        var def = $.Deferred();
        ox.idle();
        auth.getAuthentication(error).then(function (data) {
            authenticating = false;
            if (data) {
                api.doAuth(data.provider, data.id, data.response).then(function (data) {
                    def.resolve(data);
                }, function (rejection) {
                    if (rejection.value === 'AUTHENTICATION_DENIED') {
                        error = gt('Authentication was denied.  Attempt %i of %i allowed attempts', rejection.failedCount, rejection.maxFailedAllowed);
                    } else {
                        error = rejection.error + ': ' + rejection.error_desc;
                    }
                    authenticate(error).then(def.resolve, def.reject);
                });
            } else {
                def.reject();
            }
        }, function (data) {
            debugger;
            def.reject(data);
        });
        return def;
    }

    return auth;

});

