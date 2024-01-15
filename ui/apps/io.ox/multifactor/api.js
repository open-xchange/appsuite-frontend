/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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

    // Establish if we use U2F or webuathn.  Firefox still supports U2F
    function checkProvider(provider) {
        if (provider.indexOf('U2F') > -1) {
            if (window.u2f) return provider;
            return 'WebAuthn';
        }
        return provider;
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
            return require(['static/3rd.party/purify.min.js']).then(function (DOMPurify) {
                return $.when(
                    http.GET({
                        module: 'multifactor/device',
                        params: { action: 'all' },
                        force: true
                    })
                ).then(function (data) {
                    if (_.isArray(data)) {
                        var devices = [];
                        data.forEach(function (device) {
                            // make sure name is a string (See Bug 66936)
                            device.name = DOMPurify.sanitize(device.name, { ALLOW_DATA_ATTR: false }) + '';
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
                });
            });
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
                    params: { action: 'startAuthentication', deviceId: id, providerName: checkProvider(provider) },
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
