/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/guard/auth/authorizer', ['io.ox/core/capabilities'], function (capabilities) {
    'use strict';

    var auth = {};

    // If Guard enabled, creates prompt with optional prompt
    // options may contain { optPrompt: "Prompt", forceRelogin: true/false, callback: function }
    // If optPrompt undefined, uses standard wording "Enter Guard password"
    // forceRelogin requires password prompt regardless if stored
    // minSingleUse requires the authentication be stored in the session until used
    // callback function is called when the user clicks OK after entering password
    auth.authorize = function authorize(baton, options) {
        var def = $.Deferred();
        if (capabilities.has('guard')) {
            require(['oxguard/auth'], function (auth_core) {
                auth_core.authorize(baton, options).then(function (auth) {
                    def.resolve(auth);
                }, function (reject) {
                    def.reject(reject);
                });
            });
        } else {
            def.reject();
        }
        return def;
    };

    return auth;

});

