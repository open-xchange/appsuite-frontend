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

define('io.ox/calendar/actions/invite', [
    'settings!io.ox/calendar',
    'io.ox/calendar/util'
], function (settings, util) {

    'use strict';

    return function (data) {

        // use ox.launch to have an indicator for slow connections
        ox.launch('io.ox/calendar/edit/main').done(function () {

            // include external organizer
            var attendees = data.attendees;
            if (!data.organizer.entity && _.isString(data.organizer.cn)) {
                data.organizer.partStat = 'NEEDS-ACTION';
                attendees.unshift(data.organizer);
            }

            // clean up attendees (remove confirmation status comments etc)
            attendees = util.cleanupAttendees(attendees);

            // open create dialog with same participants
            data = {
                folder: settings.get('chronos/defaultFolderId'),
                attendees: attendees,
                startDate: { value: moment().startOf('hour').format('YYYYMMDD[T]HHmmss'), tzid: moment().tz() },
                endDate: { value: moment().startOf('hour').add(1, 'hours').format('YYYYMMDD[T]HHmmss'), tzid: moment().tz() }
            };
            this.create(data);
        });
    };
});
