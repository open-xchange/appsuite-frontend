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

    var api = {
        getProviders: function () {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.GET({
                module: 'multifactor',
                params: { action: 'get' }
            }).then(function (data) {
                console.log(data);
                def.resolve(data);
            }, def.reject);
            return def;
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
        deleteDevice: function (provider, id, code) {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.GET({
                module: 'multifactor',
                params: { action: 'delete', deviceId: id, providerName: provider, secret_code: code }
            }).then(function (data) {
                console.log(data);
                def.resolve(data);
            }, def.reject);
            return def;
        },
        beginAuth: function (provider, id) {
            var def = $.Deferred();
            // Do query to server for multifactor status
            http.GET({
                module: 'multifactor',
                params: { action: 'begin', deviceId: id, providerName: provider }
            }).then(function (data) {
                console.log(data);
                def.resolve(data);
            }, def.reject);
            return def;
        }
    };

    return api;

});
