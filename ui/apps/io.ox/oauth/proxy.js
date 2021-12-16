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

define('io.ox/oauth/proxy', ['io.ox/core/http'], function (http) {

    'use strict';

    var that = {
        request: function (options) {
            var params = {};
            if (options.api) {
                params.api = options.api;
                delete options.api;
            }

            if (options.account) {
                params.account = options.account;
                delete options.account;
            }
            return http.PUT({
                module: 'oauth/proxy',
                params: params,
                data: options
            });
        }
    };

    return that;
});
