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
    'io.ox/multifactor/bundle'
], function (api, selectDeviceView, deviceAuthenticator, modules) {

    'use strict';

    var authenticating = false,
        authProcess;

    if (modules.exports && !window.u2f) {
        window.u2f = modules.exports;
    }

    var auth = {

        getAuthentication: function (authInfo) {
            if (authenticating) {
                return authProcess;
            }
            authenticating = true;
            var def = authProcess = $.Deferred();
            authInfo.def = def;
            if (authInfo.error && authInfo.error.backup) {
                require(['io.ox/multifactor/lost'], function (lost) {
                    lost(authInfo);
                });
                return def;
            }
            api.getDevices().then(function (list) {
                if (list && list.length > 0) {
                    if (list && list.length > 1) {
                        selectDeviceView.open(list, authInfo);
                    } else {
                        var device = list[0];
                        authInfo = _.extend(authInfo, { providerName: device.providerName, device: device });
                        deviceAuthenticator.getAuth(authInfo);
                    }
                } else {
                    def.reject();
                }

            }, function (fail) {
                def.reject(fail);
            });
            return def;
        },

        doAuthentication: authenticate,

        reAuthenticate: function () {
            return authenticate({ reAuth: true });
        }

    };

    function notifyFailure(message) {
        require(['io.ox/core/notifications'], function (notify) {
            notify.yell('error', message);
            $('#io-ox-core').show();  // May be hidden in login
            $('.multifactorBackground').hide();  // If covered with background, hide
        });
    }

    function authenticate(authInfo) {
        authInfo = authInfo || {};
        var def = $.Deferred();
        ox.idle();
        auth.getAuthentication(authInfo).then(function (data) {
            authenticating = false;
            if (data) {
                api.doAuth(data.provider, data.id, data.response, data.parameters).then(function (data) {
                    def.resolve(data);
                }, function (rejection) {
                    authInfo.error = {
                        backup: data.backup === true
                    };
                    if (rejection.code && (/MFA-002[1-3]/).test(rejection.code)) {
                        authInfo.error.text = rejection.error;
                    } else {
                        if (rejection) notifyFailure(rejection.error);
                        window.setTimeout(function () {
                            def.reject();
                        }, 3000);
                        return;
                    }
                    authenticate(authInfo).then(def.resolve, def.reject);
                });
            } else {
                def.reject();
            }
        }, function (data) {
            if (data && data.error) {
                notifyFailure(data.error);
                window.setTimeout(function () {
                    def.reject();
                }, 3000);
                return;
            }
            def.reject(data);
        });
        return def;
    }

    return auth;

});

