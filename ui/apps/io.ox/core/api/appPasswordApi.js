/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
