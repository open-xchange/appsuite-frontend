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

define('io.ox/calendar/actions/follow-up', [
    'io.ox/calendar/util'
], function (util) {

    'use strict';

    return function (model) {

        // reduce data
        var copy = model.pick(
            'color class folder location description participants attendees transp summary'.split(' ')
        );

        // check isBefore once for the startDate; then reuse that information for endDate (see bug 44647)
        var needsShift = false,
            isAllday = util.isAllday(model),
            format = isAllday ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';

        // copy date/time
        ['startDate', 'endDate'].forEach(function (field) {
            var ref = model.getMoment(field),
                // set date to today, keep time, then use same weekday
                d = moment({ hour: ref.hour(), minute: ref.minute() }).weekday(ref.weekday()),
                target = moment.max(d, ref);

            // shift about one week?
            if (needsShift || target.isBefore(moment()) || target.isSameOrBefore(ref)) {
                target.add(1, 'w');
                needsShift = true;
            }

            // if this is the endDate and the appointment is an all day appointment we need to subtract 1 day
            // (see bug 63806)
            if (field === 'endDate' && isAllday) target.subtract(1, 'day');

            copy[field] = { value: target.format(format), tzid: model.get(field).tzid };
        });

        // clean up attendees (remove confirmation status comments etc)
        copy.attendees = util.cleanupAttendees(copy.attendees);

        // use ox.launch to have an indicator for slow connections
        ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
            edit.getApp().launch().done(function () {
                this.create(copy);
            });
        });
    };
});
