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

define('io.ox/core/api/certificate', [
    'io.ox/core/http',
    'io.ox/core/event'
], function (http, Events) {

    'use strict';


    var api = {

        examine: function (data) {
            return http.GET({
                module: 'certificate',
                params: { action: 'examine', fingerprint: data.fingerprint },
                data: data
            });
        },

        getAll: function () {

            return http.GET({
                module: 'certificate',
                params: { action: 'all' }
            });
        },

        get: function (data) {

            return http.GET({
                module: 'certificate',
                params: { action: 'get', fingerprint: data.fingerprint }

            });
        },

        update: function (data) {
            return http.GET({
                module: 'certificate',
                params: { action: 'update', fingerprint: data.fingerprint, hostname: data.hostname, trust: data.trust }

            });
        },

        remove: function (data) {
            return http.PUT({
                module: 'certificate',
                params: { action: 'delete', fingerprint: data.fingerprint, hostname: data.hostname }

            });
        }

    };

    Events.extend(api);

    return api;
});
