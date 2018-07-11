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
        if (data && data.value === 'AUTHENTICATION_DENIED') {
            return data.value;
        }
    }

    var api = {
        getProviders: function () {
            return $.when(
                http.PUT({
                    module: 'multifactor',
                    params: { action: 'get' }
                })
            );
        },
        getDevices: function () {
            return this.getProviders().then(function (data) {
                var devices = [];
                if (_.isArray(data.providers)) {
                    data.providers.forEach(function (provider) {
                        provider.devices.forEach(function (device) {
                            device.provider = provider;
                            devices.push(device);
                        });
                    });
                }
                return (devices);
            });

        },
        deleteDevice: function (deviceToDeleteProvider, deviceToDelete, provider, id, code) {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.PUT({
                module: 'multifactor',
                params: { action: 'delete', deviceToDelete: deviceToDelete, deviceToDeleteProvider: deviceToDeleteProvider, deviceId: id, providerName: provider, secret_code: code }
            }).then(function (data) {
                if (checkError(data)) {
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
                    params: { action: 'begin', deviceId: id, providerName: provider }
                }));
        },
        beginRegistration: function (provider, name) {
            return $.when(
                http.GET({
                    module: 'multifactor',
                    params: { action: 'startRegistration', providerName: provider, name: name }
                }));
        },
        finishRegistration: function (provider, id, confirmation) {
            return $.when(
                http.POST({
                    module: 'multifactor',
                    params: { action: 'finishRegistration', deviceId: id, providerName: provider, secret_code: confirmation }
                }));
        },
        doAuth: function (provider, id, code) {
            var def = $.Deferred();
            http.POST({
                module: 'multifactor',
                params: { action: 'doAuth', deviceId: id, providerName: provider, secret_code: code }
            }).then(function (data) {
                if (checkError(data)) {
                    def.reject(checkError(data));
                }
                def.resolve(data);
            }, def.reject);
            return def;
        }
    };

    return api;

});
