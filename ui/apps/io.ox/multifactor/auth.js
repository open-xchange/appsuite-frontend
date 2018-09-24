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
    'io.ox/core/session',
    'gettext!io.ox/core/boot',
    'io.ox/multifactor/bundle'
], function (api, selectDeviceView, deviceAuthenticator, session, gt) {

    'use strict';

    var authenticating = false;

    var auth = {

        getAuthentication: function (error) {
            if (authenticating) {
                return $.when();
            }
            authenticating = true;
            var def = $.Deferred();
            if (error && error.backup) {
                require(['io.ox/multifactor/lost'], function (lost) {
                    lost(def, error);
                });
                return def;
            }
            api.getDevices().then(function (list) {
                if (list && list.length > 0) {
                    if (list && list.length > 1) {
                        selectDeviceView.open(list, def, error);
                    } else {
                        var device = list[0];
                        deviceAuthenticator.getAuth(device.provider.name, device, def, error);
                    }
                } else {
                    def.reject();
                }

            });
            return def;
        },

        doAuthentication: authenticate,

        updateSession: function () {
            return session.rampup().then(function (data) {
                if (data) session.set(data);
            });
        },
        forceLogout: function () {
            return session.logout().always(function () {
                window.location.reload(true);
            });
        }

    };

    function notifyFailure(message) {
        require(['io.ox/core/notifications'], function (notify) {
            notify.yell('error', message);
            $('#io-ox-core').show();  // May be hidden in login
        });
    }

    function authenticate(error) {
        var def = $.Deferred();
        ox.idle();
        auth.getAuthentication(error).then(function (data) {
            authenticating = false;
            if (data) {
                api.doAuth(data.provider, data.id, data.response, data.parameters).then(function (data) {
                    def.resolve(data);
                }, function (rejection) {
                    error = {
                        backup: data.backup === true
                    };
                    if (rejection && rejection.value === 'AUTHENTICATION_DENIED') {
                        if (rejection.lockoutResult) {
                            error.text = gt('Authentication was denied.  Attempt %i of %i allowed attempts', rejection.lockoutResult.count, rejection.lockoutResult.maxAllowed);
                        } else {
                            error.text = gt('Authentication was denied.');
                        }
                    } else {
                        if (rejection) notifyFailure(rejection.error);
                        window.setTimeout(function () {
                            def.reject();
                        }, 3000);
                        return;
                    }
                    authenticate(error).then(def.resolve, def.reject);
                });
            } else {
                def.reject();
            }
        }, function (data) {
            if (data && data.error) {
                notifyFailure(data.error);
            }
            def.reject(data);
        });
        return def;
    }

    return auth;

});

