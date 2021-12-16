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

define('io.ox/calendar/freetime/model', [
    'settings!io.ox/calendar',
    'io.ox/calendar/model'
], function (settings, models) {

    'use strict';

    var model = Backbone.Model.extend({
        initialize: function () {
            var now = moment().startOf(settings.get('scheduling/dateRange', 'week'));
            this.set({
                timezone: now.tz(),
                startDate: now,
                compact: settings.get('scheduling/compact', false),
                zoom: settings.get('scheduling/zoom', '100'),
                onlyWorkingHours: settings.get('scheduling/onlyWorkingHours', true),
                startHour: Math.max(parseInt(settings.get('startTime', 8), 10) - 1, 0),
                endHour: Math.min(parseInt(settings.get('endTime', 18), 10), 24),
                attendees: new models.AttendeeCollection(null, { resolveGroups: true }),
                showFree: settings.get('scheduling/showFree', false),
                showReserved: settings.get('scheduling/showReserved', true),
                showFineGrid: settings.get('scheduling/showFineGrid', false),
                timeSlots: {},
                dateRange: settings.get('scheduling/dateRange', 'week')
            });
        }
    });

    return model;
});
