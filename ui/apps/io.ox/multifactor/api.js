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
    'io.ox/core/http',
    'static/3rd.party/purify.min.js'
], function (http, DOMPurify) {

    'use strict';

    function checkError(data) {
        if (data && data.error) {
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell('error', data.error);
            });
            console.error(data.error);
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
                http.GET({
                    module: 'multifactor/provider',
                    params: { action: 'all' },
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
                    checkError(data);
                }
                ));
        },
        getDevices: function (type) {
            var devices = [];
            return $.when(
                http.GET({
                    module: 'multifactor/device',
                    params: { action: 'all' },
                    force: true
                }).then(function (data) {
                    if (_.isArray(data)) {
                        data.forEach(function (device) {
                            // make sure name is a string (See Bug 66936)
                            device.name = DOMPurify.sanitize(device.name) + '';
                            switch (type) {
                                case 'BACKUP':
                                    if (device.backup) {
                                        devices.push(device);
                                    }
                                    break;
                                case 'APP':
                                    if (device.trustedApplicationDevice) {
                                        devices.push(device);
                                    }
                                    break;
                                default:  // regular device
                                    if (!device.trustedApplicationDevice && !device.backup) {
                                        devices.push(device);
                                    }
                            }
                        });
                        return (devices);
                    }
                    checkError(data);
                }, function (fail) {
                    checkError(fail);
                    return $.Deferred().reject(fail);
                }));
        },
        deleteDevice: function (provider, deviceId) {
            var def = $.Deferred();
            http.PUT({
                module: 'multifactor/device',
                params: { action: 'delete', providerName: provider, deviceId: deviceId }
            }).then(function (data) {
                if (data && data.error) {
                    def.reject(checkError(data));
                }
                def.resolve(data);
            }, def.reject);
            return def;
        },
        editDevice: function (provider, deviceId, newName) {
            var def = $.Deferred();
            http.PUT({
                module: 'multifactor/device',
                params: { action: 'rename', providerName: provider, deviceId: deviceId },
                data: { name: newName, providerName: provider, id: deviceId }
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
                http.PUT({
                    module: 'multifactor/device',
                    params: { action: 'startAuthentication', deviceId: id, providerName: provider },
                    force: true
                }));
        },
        beginRegistration: function (provider, name, backup, additParams) {
            return $.when(
                http.PUT({
                    module: 'multifactor/device',
                    params: { action: 'startRegistration' },
                    data: { providerName: provider, name: name, backup: backup, parameters: additParams }
                }))
                .then(checkError, checkError);
        },
        finishRegistration: function (provider, device, data, additParams) {
            return $.when(
                http.PUT({
                    module: 'multifactor/device',
                    params: _.extend({ action: 'finishRegistration', providerName: provider, deviceId: device },
                        additParams),
                    data: data
                }));
        },
        doAuth: function (provider, id, code, additParams) {
            var def = $.Deferred();
            var providerParameters = _.extend({ secret_code: code }, additParams);
            http.PUT({
                module: 'multifactor/device',
                params: { action: 'finishAuthentication', deviceId: id, providerName: provider },
                data: providerParameters,
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
