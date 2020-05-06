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
define('io.ox/core/api/appPasswordApi', [
    'io.ox/core/http'
], function (http) {

    'use strict';

    function checkError(data) {
        if (data && data.error) {
            return $.Deferred().reject(data.error);
        }
        return data;
    }

    var api = {
        getApps: function () {
            return $.when(
                http.GET({
                    module: 'appPasswords',
                    params: { action: 'getApps' },
                    force: true
                }).always(function (data) {
                    return checkError(data);
                }
                ));
        },
        getPasswords: function () {
            return $.when(
                http.GET({
                    module: 'appPasswords',
                    params: { action: 'list' },
                    force: true
                }).always(function (data) {
                    return checkError(data);
                }
                ));
        },
        remove: function (id) {
            var data = {
                uuid: id
            };
            return $.when(
                http.POST({
                    module: 'appPasswords',
                    params: { action: 'remove' },
                    data: data
                }).always(function (data) {
                    return checkError(data);
                }
                ));
        },
        addPassword: function (name, scope) {
            var data = {
                appName: name,
                appScope: scope
            };
            return $.when(
                http.POST({
                    module: 'appPasswords',
                    params: { action: 'add' },
                    data: data
                }).always(function (data) {
                    return checkError(data);
                }
                ));
        }
    };

    return api;

});
