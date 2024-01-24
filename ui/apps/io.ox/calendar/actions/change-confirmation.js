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

define('io.ox/calendar/actions/change-confirmation', [
    'io.ox/calendar/api'
], function (calApi) {

    'use strict';

    return function (data, options) {
        options = options || {};
        var api = options.api || calApi;

        return api.checkConflicts(data).then(function (conflicts) {

            var def = new $.Deferred();

            if (conflicts.length === 0) return def.resolve();

            ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                conflictView.dialog(conflicts)
                    .on('cancel', function () { def.reject(); })
                    .on('ignore', function () { def.resolve(); });
            });

            return def;
        });
    };

});
