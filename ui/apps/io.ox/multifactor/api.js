/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
 */
define('io.ox/multifactor/api', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    function checkError(data) {
        if (data && data.error) {
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell('error', data.error);
            });
            return data.error;
        }
        return data;
    }

    function checkFail(data) {
        if (data && data.value === 'AUTHENTICATION_DENIED') {
            return true;
        }
        return false;
    }

    var api = {
        getProviders: function (backup) {
            return $.when(
                http.PUT({
                    module: 'multifactor',
                    params: { action: 'get' },
                    force: true
                }).then(function (data) {
                    if (data) {
                        var list = [];
                        data.forEach(function (prov) {
                            if (backup && prov.backupProvider) {
                                list.push(prov);
                            }
                            if (!backup && !prov.backupOnlyProvider) {
                                list.push(prov);
                            }
                        });
                        return { providers: list };
                    }
                }
                ));
        },
        getDevices: function (backup) {
            return this.getProviders(backup).then(function (data) {
                var devices = [];
                if (_.isArray(data.providers)) {
                    data.providers.forEach(function (provider) {
                        provider.devices.forEach(function (device) {
                            device.provider = provider;
                            if (backup && device.backupDevice) {
                                devices.push(device);
                            }
                            if (!backup && !device.backupDevice) {
                                devices.push(device);
                            }
                        });
                    });
                }
                return (devices);
            });

        },
        deleteDevice: function (deviceToDeleteProvider, deviceToDelete) {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.PUT({
                module: 'multifactor',
                params: { action: 'delete', deviceToDelete: deviceToDelete, deviceToDeleteProvider: deviceToDeleteProvider }
            }).then(function (data) {
                if (data && data.error) {
                    def.reject(checkError(data));
                }
                def.resolve(data);
            }, def.reject);
            return def;
        },
        beginAuth: function (provider, id) {
            return $.when(
                http.GET({
                    module: 'multifactor',
                    params: { action: 'begin', deviceId: id, providerName: provider },
                    force: true
                }));
        },
        beginRegistration: function (provider, name, additParams) {
            var params = _.extend({ action: 'startRegistration', providerName: provider, name: name }, additParams);
            return $.when(
                http.GET({
                    module: 'multifactor',
                    params: params
                }))
                .then(checkError, checkError);
        },
        finishRegistration: function (provider, id, confirmation, additParams) {
            return $.when(
                http.POST({
                    module: 'multifactor',
                    params: _.extend({ action: 'finishRegistration', deviceId: id, providerName: provider, secret_code: confirmation },
                        additParams)
                }));
        },
        doAuth: function (provider, id, code, additParams) {
            var def = $.Deferred();
            http.POST({
                module: 'multifactor',
                params: _.extend({ action: 'doAuth', authDeviceId: id, authProviderName: provider, secret_code: code }, additParams),
                force: true
            }).then(function (data) {
                if (data && data.error) {
                    def.reject(checkError(data));
                }
                if (checkFail(data)) {
                    def.reject(data);
                } else {
                    def.resolve(data);
                }
            }, def.reject);
            return def;
        }
    };

    return api;

});
